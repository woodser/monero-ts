export = MoneroTx;
/**
 * Represents a transaction on the Monero network.
 *
 * @class
 */
declare class MoneroTx {
    /**
     * Construct the model.
     *
     * @param {MoneroTx|object} state is existing state to initialize from (optional)
     */
    constructor(state: MoneroTx | object);
    state: any;
    getBlock(): any;
    setBlock(block: any): this;
    getHeight(): any;
    getHash(): any;
    setHash(hash: any): this;
    getVersion(): any;
    setVersion(version: any): this;
    isMinerTx(): any;
    setIsMinerTx(miner: any): this;
    getPaymentId(): any;
    setPaymentId(paymentId: any): this;
    getFee(): any;
    setFee(fee: any): this;
    getRingSize(): any;
    setRingSize(ringSize: any): this;
    getRelay(): any;
    setRelay(relay: any): this;
    isRelayed(): any;
    setIsRelayed(isRelayed: any): this;
    isConfirmed(): any;
    setIsConfirmed(isConfirmed: any): this;
    inTxPool(): any;
    setInTxPool(inTxPool: any): this;
    getNumConfirmations(): any;
    setNumConfirmations(numConfirmations: any): this;
    /**
     * Get the minimum height or timestamp for the transactions to unlock.
     *
     * @return {BigInteger} the minimum height or timestamp for the transactin to unlock
     */
    getUnlockTime(): BigInteger;
    setUnlockTime(unlockTime: any): this;
    getLastRelayedTimestamp(): any;
    setLastRelayedTimestamp(lastRelayedTimestamp: any): this;
    getReceivedTimestamp(): any;
    setReceivedTimestamp(receivedTimestamp: any): this;
    isDoubleSpendSeen(): any;
    setIsDoubleSpend(isDoubleSpendSeen: any): this;
    getKey(): any;
    setKey(key: any): this;
    /**
     * Get full transaction hex.  Full hex = pruned hex + prunable hex.
     *
     * @return {string} is full transaction hex
     */
    getFullHex(): string;
    setFullHex(fullHex: any): this;
    /**
     * Get pruned transaction hex.  Full hex = pruned hex + prunable hex.
     *
     * @return {string} is pruned transaction hex
     */
    getPrunedHex(): string;
    setPrunedHex(prunedHex: any): this;
    /**
     * Get prunable transaction hex which is hex that is removed from a pruned
     * transaction. Full hex = pruned hex + prunable hex.
     *
     * @return {string} is the prunable transaction hex
     */
    getPrunableHex(): string;
    setPrunableHex(prunableHex: any): this;
    getPrunableHash(): any;
    setPrunableHash(prunableHash: any): this;
    getSize(): any;
    setSize(size: any): this;
    getWeight(): any;
    setWeight(weight: any): this;
    getInputs(): any;
    setInputs(inputs: any): this;
    getOutputs(): any;
    setOutputs(outputs: any): this;
    getOutputIndices(): any;
    setOutputIndices(outputIndices: any): this;
    getMetadata(): any;
    setMetadata(metadata: any): this;
    getExtra(): any;
    setExtra(extra: any): this;
    getRctSignatures(): any;
    setRctSignatures(rctSignatures: any): this;
    getRctSigPrunable(): any;
    setRctSigPrunable(rctSigPrunable: any): this;
    isKeptByBlock(): any;
    setIsKeptByBlock(isKeptByBlock: any): this;
    isFailed(): any;
    setIsFailed(isFailed: any): this;
    getLastFailedHeight(): any;
    setLastFailedHeight(lastFailedHeight: any): this;
    getLastFailedHash(): any;
    setLastFailedHash(lastFailedHash: any): this;
    getMaxUsedBlockHeight(): any;
    setMaxUsedBlockHeight(maxUsedBlockHeight: any): this;
    getMaxUsedBlockHash(): any;
    setMaxUsedBlockHash(maxUsedBlockHash: any): this;
    getSignatures(): any;
    setSignatures(signatures: any): this;
    copy(): MoneroTx;
    toJson(): any;
    /**
     * Updates this transaction by merging the latest information from the given
     * transaction.
     *
     * @param tx is the transaction to update this transaction with
     * @return {MoneroTx} this for method chaining
     */
    merge(tx: any): MoneroTx;
    toString(indent?: number): string;
}
declare namespace MoneroTx {
    let DEFAULT_PAYMENT_ID: string;
}
