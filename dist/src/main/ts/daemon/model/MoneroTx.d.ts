import MoneroBlock from "./MoneroBlock";
import MoneroOutput from "./MoneroOutput";
/**
 * Represents a transaction on the Monero network.
 */
export default class MoneroTx {
    static readonly DEFAULT_PAYMENT_ID = "0000000000000000";
    block: MoneroBlock;
    hash: string;
    version: number;
    isMinerTx: boolean;
    paymentId: string;
    fee: bigint;
    ringSize: number;
    relay: boolean;
    isRelayed: boolean;
    isConfirmed: boolean;
    inTxPool: boolean;
    numConfirmations: number;
    unlockTime: bigint;
    lastRelayedTimestamp: number;
    receivedTimestamp: number;
    isDoubleSpendSeen: boolean;
    key: string;
    fullHex: string;
    prunedHex: string;
    prunableHex: string;
    prunableHash: string;
    size: number;
    weight: number;
    inputs: MoneroOutput[];
    outputs: MoneroOutput[];
    outputIndices: number[];
    metadata: string;
    extra: Uint8Array;
    rctSignatures: any;
    rctSigPrunable: any;
    isKeptByBlock: boolean;
    isFailed: boolean;
    lastFailedHeight: number;
    lastFailedHash: string;
    maxUsedBlockHeight: number;
    maxUsedBlockHash: string;
    signatures: string[];
    constructor(tx?: Partial<MoneroTx>);
    /**
     * @return {MoneroBlock} tx block
     */
    getBlock(): MoneroBlock;
    /**
     * @param {MoneroBlock} block - tx block
     * @return {MoneroTx} this tx for chaining
     */
    setBlock(block: MoneroBlock): MoneroTx;
    /**
     * @return {number} tx height
     */
    getHeight(): number;
    /**
     * @return {string} tx hash
     */
    getHash(): string;
    /**
     * @param {string} hash - tx hash
     * @return {MoneroTx} this tx for chaining
     */
    setHash(hash: string): MoneroTx;
    /**
     * @return {number} tx version
     */
    getVersion(): number;
    /**
     * @param {number} version - tx version
     * @return {MoneroTx} this tx for chaining
     */
    setVersion(version: number): MoneroTx;
    /**
     * @return {boolean} true if the tx is a miner tx, false otherwise
     */
    getIsMinerTx(): boolean;
    /**
     * @param {boolean} miner - true if the tx is a miner tx, false otherwise
     * @return {MoneroTx} this tx for chaining
     */
    setIsMinerTx(miner: boolean): MoneroTx;
    /**
     * @return {string} tx payment id
     */
    getPaymentId(): string;
    /**
     * @param {string} paymentId - tx payment id
     * @return {MoneroTx} this tx for chaining
     */
    setPaymentId(paymentId: string): MoneroTx;
    /**
     * @return {bigint} tx fee
     */
    getFee(): bigint;
    /**
     * @param {bigint} fee - tx fee
     * @return {MoneroTx} this tx for chaining
     */
    setFee(fee: bigint): MoneroTx;
    /**
     * @return {number} tx ring size
     */
    getRingSize(): number;
    /**
     * @param {number} ringSize - tx ring size
     * @return {MoneroTx} this tx for chaining
     */
    setRingSize(ringSize: number): MoneroTx;
    /**
     * @return {boolean} true if the tx is set to be relayed, false otherwise
     */
    getRelay(): boolean;
    /**
     * @param {boolean} relay - true if the tx is set to be relayed, false otherwise
     * @return {MoneroTx} this tx for chaining
     */
    setRelay(relay: boolean): MoneroTx;
    /**
     * @return {boolean} true if the tx is relayed, false otherwise
     */
    getIsRelayed(): boolean;
    /**
     * @param {boolean} isRelayed - true if the tx is relayed, false otherwise
     * @return {MoneroTx} this tx for chaining
     */
    setIsRelayed(isRelayed: boolean): MoneroTx;
    /**
     * @return {boolean} true if the tx is confirmed, false otherwise
     */
    getIsConfirmed(): boolean;
    /**
     * @param {boolean} isConfirmed - true if the tx is confirmed, false otherwise
     * @return {MoneroTx} this tx for chaining
     */
    setIsConfirmed(isConfirmed: boolean): MoneroTx;
    /**
     * @return {boolean} true if the tx is in the memory pool, false otherwise
     */
    getInTxPool(): boolean;
    /**
     * @param {boolean} inTxPool - true if the tx is in the memory pool, false otherwise
     * @return {MoneroTx} this tx for chaining
     */
    setInTxPool(inTxPool: boolean): MoneroTx;
    /**
     * @return {number} number of block confirmations
     */
    getNumConfirmations(): number;
    /**
     * @param {number} numConfirmations - number of block confirmations
     * @return {MoneroTx} this tx for chaining
     */
    setNumConfirmations(numConfirmations: number): MoneroTx;
    /**
     * Get the minimum height or timestamp for the transactions to unlock.
     *
     * @return {bigint} the minimum height or timestamp for the transaction to unlock
     */
    getUnlockTime(): bigint;
    setUnlockTime(unlockTime: bigint | string | number | undefined): MoneroTx;
    /**
     * @return {number} timestamp the tx was last relayed from the node
     */
    getLastRelayedTimestamp(): number;
    /**
     * @param {number} lastRelayedTimestamp - timestamp the tx was last relayed from the node
     * @return {MoneroTx} this tx for chaining
     */
    setLastRelayedTimestamp(lastRelayedTimestamp: number): MoneroTx;
    /**
     * @return {number} timestamp the tx was received at the node
     */
    getReceivedTimestamp(): number;
    /**
     * @param {number} receivedTimestamp - timestamp the tx was received at the node
     * @return {MoneroTx} this tx for chaining
     */
    setReceivedTimestamp(receivedTimestamp: number): MoneroTx;
    /**
     * @return {boolean} true if a double spend has been seen, false otherwise
     */
    getIsDoubleSpendSeen(): boolean;
    /**
     * @param {boolean} isDoubleSpendSeen - true if a double spend has been seen, false otherwise
     * @return {MoneroTx} this tx for chaining
     */
    setIsDoubleSpendSeen(isDoubleSpendSeen: boolean): MoneroTx;
    /**
     * @return {string} tx key
     */
    getKey(): string;
    /**
     * @param {string} key - tx key
     * @return {MoneroTx} this tx for chaining
     */
    setKey(key: string): MoneroTx;
    /**
     * Get full transaction hex. Full hex = pruned hex + prunable hex.
     *
     * @return {string|undefined} full tx hex
     */
    getFullHex(): string | undefined;
    /**
     * @param {string} fullHex - full tx hex
     * @return {MoneroTx} this tx for chaining
     */
    setFullHex(fullHex: string): MoneroTx;
    /**
     * Get pruned transaction hex. Full hex = pruned hex + prunable hex.
     *
     * @return {string} pruned tx hex
     */
    getPrunedHex(): string;
    /**
     * @param {string} prunedHex - pruned tx hex
     * @return {MoneroTx} this tx for chaining
     */
    setPrunedHex(prunedHex: string): MoneroTx;
    /**
     * Get prunable transaction hex which is hex that is removed from a pruned
     * transaction. Full hex = pruned hex + prunable hex.
     *
     * @return {string} prunable tx hex
     */
    getPrunableHex(): string;
    /**
     * @param {string} prunableHex - prunable tx hex
     * @return {MoneroTx} this tx for chaining
     */
    setPrunableHex(prunableHex: string): MoneroTx;
    /**
     * @return {string} prunable tx hash
     */
    getPrunableHash(): string;
    /**
     * @param {string} prunableHash - prunable tx hash
     * @return {MoneroTx} this tx for chaining
     */
    setPrunableHash(prunableHash: string): MoneroTx;
    /**
     * @return {number} tx size
     */
    getSize(): number;
    /**
     * @param {number} size - tx size
     * @return {MoneroTx} this tx for chaining
     */
    setSize(size: number): MoneroTx;
    /**
     * @return {number} tx weight
     */
    getWeight(): number;
    /**
     * @param {number} weight - tx weight
     * @return {MoneroTx} this tx for chaining
     */
    setWeight(weight: number): MoneroTx;
    /**
     * @return {MoneroOutput[]} tx inputs
     */
    getInputs(): MoneroOutput[];
    /**
     * @param {MoneroOutput[]} - tx inputs
     * @return {MoneroTx} this tx for chaining
     */
    setInputs(inputs: MoneroOutput[]): MoneroTx;
    /**
     * @return {MoneroOutput[]} tx outputs
     */
    getOutputs(): MoneroOutput[];
    /**
     * @param {MoneroOutput[]} outputs - tx outputs
     * @return {MoneroTx} this tx for chaining
     */
    setOutputs(outputs: MoneroOutput[]): MoneroTx;
    /**
     * @return {number[]} tx output indices
     */
    getOutputIndices(): number[];
    /**
     * @param {number[]} outputIndices - tx output indices
     * @return {MoneroTx} this tx for chaining
     */
    setOutputIndices(outputIndices: number[]): MoneroTx;
    /**
     * @return {string} tx metadata
     */
    getMetadata(): string;
    /**
     * @param {string} metadata - tx metadata
     * @return {MoneroTx} this tx for chaining
     */
    setMetadata(metadata: string): MoneroTx;
    /**
     * @return {Uint8Array} tx extra
     */
    getExtra(): Uint8Array;
    /**
     * @param {Uint8Array} extra - tx extra
     * @return {MoneroTx} this tx for chaining
     */
    setExtra(extra: Uint8Array): MoneroTx;
    /**
     * @return {any} RCT signatures
     */
    getRctSignatures(): any;
    /**
     * @param {any} rctSignatures - RCT signatures
     * @return {MoneroTx} this tx for chaining
     */
    setRctSignatures(rctSignatures: any): MoneroTx;
    /**
     * @return {any} prunable RCT signature data
     */
    getRctSigPrunable(): object;
    /**
     * @param {any} rctSigPrunable - prunable RCT signature data
     * @return {MoneroTx} this tx for chaining
     */
    setRctSigPrunable(rctSigPrunable: any): MoneroTx;
    /**
     * @return {boolean} true if kept by a block, false otherwise
     */
    getIsKeptByBlock(): boolean;
    /**
     * @param {boolean} isKeptByBlock - true if kept by a block, false otherwise
     * @return {MoneroTx} this tx for chaining
     */
    setIsKeptByBlock(isKeptByBlock: boolean): MoneroTx;
    /**
     * @return {boolean} true if the tx failed, false otherwise
     */
    getIsFailed(): boolean;
    /**
     * @param {boolean} isFailed - true if the tx failed, false otherwise
     * @return {MoneroTx} this tx for chaining
     */
    setIsFailed(isFailed: boolean): MoneroTx;
    /**
     * @return {number} block height of the last tx failure
     */
    getLastFailedHeight(): number;
    /**
     * @param {number} lastFailedHeight - block height of the last tx failure
     * @return {MoneroTx} this tx for chaining
     */
    setLastFailedHeight(lastFailedHeight: number): MoneroTx;
    /**
     * @return {string} block hash of the last tx failure
     */
    getLastFailedHash(): string;
    /**
     * @param {string} lastFailedHash - block hash of the last tx failure
     * @return {MoneroTx} this tx for chaining
     */
    setLastFailedHash(lastFailedHash: string): MoneroTx;
    /**
     * @return {number} max used block height
     */
    getMaxUsedBlockHeight(): number;
    /**
     * @param {number} maxUsedBlockHeight - max used block height
     * @return {MoneroTx} this tx for chaining
     */
    setMaxUsedBlockHeight(maxUsedBlockHeight: number): MoneroTx;
    /**
     * @return {string} max used block hash
     */
    getMaxUsedBlockHash(): string;
    /**
     * @param {string} maxUsedBlockHash - max used block hash
     * @return {MoneroTx} this tx for chaining
     */
    setMaxUsedBlockHash(maxUsedBlockHash: string): MoneroTx;
    /**
     * @return {string[]} tx signatures
     */
    getSignatures(): string[];
    /**
     * @param {string[]} signatures - tx signatures
     * @return {MoneroTx} this tx for chaining
     */
    setSignatures(signatures: string[]): MoneroTx;
    /**
     * @return {MoneroTx} a copy of this tx
     */
    copy(): MoneroTx;
    /**
     * @return {any} json representation of this tx
     */
    toJson(): any;
    /**
     * Updates this transaction by merging the latest information from the given
     * transaction.
     *
     * @param {MoneroTx} tx - the transaction to update this transaction with
     * @return {MoneroTx} this for method chaining
     */
    merge(tx: MoneroTx): MoneroTx;
    /**
     * @param {number} [indent] - starting indentation
     * @return {string} string representation of this tx
     */
    toString(indent?: number): string;
}
