import MoneroBlock from "../../daemon/model/MoneroBlock";
import MoneroIncomingTransfer from "./MoneroIncomingTransfer";
import MoneroOutgoingTransfer from "./MoneroOutgoingTransfer";
import MoneroOutputQuery from "./MoneroOutputQuery";
import MoneroOutput from "../../daemon/model/MoneroOutput";
import MoneroOutputWallet from "./MoneroOutputWallet";
import MoneroTransfer from "./MoneroTransfer";
import MoneroTransferQuery from "./MoneroTransferQuery";
import MoneroTx from "../../daemon/model/MoneroTx";
import MoneroTxSet from "./MoneroTxSet";
/**
 * Models a Monero transaction with wallet extensions.
 */
export default class MoneroTxWallet extends MoneroTx {
    txSet: MoneroTxSet;
    isIncoming: boolean;
    isOutgoing: boolean;
    incomingTransfers: MoneroIncomingTransfer[];
    outgoingTransfer: MoneroOutgoingTransfer;
    note: string;
    isLocked: boolean;
    inputSum: bigint;
    outputSum: bigint;
    changeAddress: string;
    changeAmount: bigint;
    numDummyOutputs: number;
    extraHex: string;
    /**
     * Construct the model.
     *
     * @param {Partial<MoneroTxWallet>} [tx] is existing state to initialize from (optional)
     */
    constructor(tx?: Partial<MoneroTxWallet>);
    /**
     * @return {any} json representation of this tx
     */
    toJson(): any;
    /**
     * @return {MoneroTxSet} tx set containing txs
     */
    getTxSet(): MoneroTxSet;
    /**
     * @param {MoneroTxSet} txSet - tx set containing txs
     * @return {MoneroTxWallet} this tx for chaining
     */
    setTxSet(txSet: MoneroTxSet): MoneroTxWallet;
    /**
     * @return {boolean} true if the tx has incoming funds, false otherwise
     */
    getIsIncoming(): boolean;
    /**
     * @param {boolean} isIncoming - true if the tx has incoming funds, false otherwise
     * @return {MoneroTxWallet} this tx for chaining
     */
    setIsIncoming(isIncoming: boolean): MoneroTxWallet;
    /**
     * @return {boolean} true if the tx has outgoing funds, false otherwise
     */
    getIsOutgoing(): boolean;
    /**
     * @param {boolean} isOutgoing - true if the tx has outgoing funds, false otherwise
     * @return {MoneroTxWallet} this tx for chaining
     */
    setIsOutgoing(isOutgoing: boolean): MoneroTxWallet;
    /**
     * @return {bigint} amount received in the tx
     */
    getIncomingAmount(): bigint;
    /**
     * @return {bigint} amount spent in the tx
     */
    getOutgoingAmount(): bigint;
    /**
     * @param {MoneroTransferQuery} [transferQuery] - query to get specific transfers
     * @return {MoneroTransfer[]} transfers matching the query
     */
    getTransfers(transferQuery?: MoneroTransferQuery): MoneroTransfer[];
    /**
     * @param {MoneroTransferQuery} transferQuery - query to keep only specific transfers
     * @return {MoneroTransfer[]} remaining transfers matching the query
     */
    filterTransfers(transferQuery: MoneroTransferQuery): MoneroTransfer[];
    /**
     * @return {MoneroIncomingTransfer[]} incoming transfers
     */
    getIncomingTransfers(): MoneroIncomingTransfer[];
    /**
     * @param {MoneroIncomingTransfer[]} incomingTransfers - incoming transfers
     * @return {MoneroTxWallet} this tx for chaining
     */
    setIncomingTransfers(incomingTransfers: MoneroIncomingTransfer[]): MoneroTxWallet;
    /**
     * @return {MoneroOutgoingTransfer} outgoing transfers
     */
    getOutgoingTransfer(): MoneroOutgoingTransfer;
    /**
     * @param {MoneroOutgoingTransfer} outgoingTransfer - outgoing transfer
     * @return {MoneroTxWallet} this tx for chaining
     */
    setOutgoingTransfer(outgoingTransfer: MoneroOutgoingTransfer): MoneroTxWallet;
    /**
     * @param {MoneroOutputWallet[]} outputQuery - query to get specific inputs
     * @return {MoneroOutputWallet[]} inputs matching the query
     */
    getInputsWallet(outputQuery?: MoneroOutputQuery): MoneroOutputWallet[];
    /**
     * @param {MoneroOutputWallet[]} inputs - tx inputs
     * @return {MoneroTxWallet} this tx for chaining
     */
    setInputsWallet(inputs: MoneroOutputWallet[]): MoneroTxWallet;
    /**
     * @param {MoneroOutputQuery} [outputQuery] - query to get specific outputs
     * @return {MoneroOutputWallet[]} outputs matching the query
     */
    getOutputsWallet(outputQuery?: MoneroOutputQuery): MoneroOutputWallet[];
    /**
     * @param {MoneroOutputWallet[]} outputs - tx outputs
     * @return {MoneroTxWallet} this tx for chaining
     */
    setOutputsWallet(outputs: MoneroOutputWallet[]): MoneroTxWallet;
    /**
     * @param {MoneroOutputQuery} outputQuery - query to keep only specific outputs
     * @return {MoneroTransfer[]} remaining outputs matching the query
     */
    filterOutputs(outputQuery: MoneroOutputQuery): MoneroTransfer[];
    /**
     * @return {string} tx note
     */
    getNote(): string;
    /**
     * @param {string} note - tx note
     * @return {MoneroTxWallet} this tx for chaining
     */
    setNote(note: string): MoneroTxWallet;
    /**
     * @return {boolean} true if the tx is locked, false otherwise
     */
    getIsLocked(): boolean;
    /**
     * @param {boolean} isLocked - true if the tx is locked, false otherwise
     * @return {MoneroTxWallet} this tx for chaining
     */
    setIsLocked(isLocked: boolean): MoneroTxWallet;
    /**
     * @return {bigint} sum of tx inputs
     */
    getInputSum(): bigint;
    /**
     * @param {bigint} inputSum - sum of tx inputs
     * @return {MoneroTxWallet} this tx for chaining
     */
    setInputSum(inputSum: bigint): MoneroTxWallet;
    /**
     * @return {bigint} sum of tx outputs
     */
    getOutputSum(): bigint;
    /**
     * @param {bigint} outputSum - sum of tx outputs
     * @return {MoneroTxWallet} this tx for chaining
     */
    setOutputSum(outputSum: bigint): MoneroTxWallet;
    /**
     * @return {string} change address
     */
    getChangeAddress(): string;
    /**
     * @param {string} changeAddress - change address
     * @return {MoneroTxWallet} this tx for chaining
     */
    setChangeAddress(changeAddress: string): MoneroTxWallet;
    /**
     * @return {bigint} change amount
     */
    getChangeAmount(): bigint;
    /**
     * @param {bigint} changeAmount - change amount
     * @return {MoneroTxWallet} this tx for chaining
     */
    setChangeAmount(changeAmount: bigint): MoneroTxWallet;
    /**
     * @return {number} number of dummy outputs
     */
    getNumDummyOutputs(): number;
    /**
     * @param {number} numDummyOutputs - number of dummy outputs
     * @return {MoneroTxWallet} this tx for chaining
     */
    setNumDummyOutputs(numDummyOutputs: number): MoneroTxWallet;
    /**
     * @return {string} tx extra as hex
     */
    getExtraHex(): string;
    /**
     * @param {string} extraHex - tx extra as hex
     * @return {MoneroTxWallet} this tx for chaining
     */
    setExtraHex(extraHex: string): MoneroTxWallet;
    /**
     * @return {MoneroTxWallet} a copy of this tx
     */
    copy(): MoneroTxWallet;
    /**
     * Updates this transaction by merging the latest information from the given
     * transaction.
     *
     * Merging can modify or build references to the transaction given so it
     * should not be re-used or it should be copied before calling this method.
     *
     * @param {MoneroTxWallet} tx - the transaction to merge into this transaction
     */
    merge(tx: MoneroTxWallet): MoneroTxWallet;
    /**
     * @param {number} [indent] - starting indentation
     * @param {boolean} [oneLine] - string is one line if true, multiple lines if false
     * @return {string} string representation of this tx
     */
    toString(indent?: number, oneLine?: boolean): string;
    protected static mergeIncomingTransfer(transfers: any, transfer: any): void;
    setBlock(block: MoneroBlock): MoneroTxWallet;
    setHash(hash: string): MoneroTxWallet;
    setVersion(version: number): MoneroTxWallet;
    setIsMinerTx(isMinerTx: boolean): MoneroTxWallet;
    setPaymentId(paymentId: string): MoneroTxWallet;
    setFee(fee: bigint): MoneroTxWallet;
    setRingSize(ringSize: number): MoneroTxWallet;
    setRelay(relay: boolean): MoneroTxWallet;
    setIsRelayed(isRelayed: boolean): MoneroTxWallet;
    setIsConfirmed(isConfirmed: boolean): MoneroTxWallet;
    setInTxPool(inTxPool: boolean): MoneroTxWallet;
    setNumConfirmations(numConfirmations: number): MoneroTxWallet;
    setUnlockTime(unlockTime: bigint): MoneroTxWallet;
    setLastRelayedTimestamp(lastRelayedTimestamp: number): MoneroTxWallet;
    setReceivedTimestamp(receivedTimestamp: number): MoneroTxWallet;
    setIsDoubleSpendSeen(isDoubleSpendSeen: boolean): MoneroTxWallet;
    setKey(key: string): MoneroTxWallet;
    setFullHex(fullHex: string): MoneroTxWallet;
    setPrunedHex(prunedHex: string): MoneroTxWallet;
    setPrunableHex(prunableHex: string): MoneroTxWallet;
    setPrunableHash(prunableHash: string): MoneroTxWallet;
    setSize(size: number): MoneroTxWallet;
    setWeight(weight: number): MoneroTxWallet;
    setInputs(inputs: MoneroOutput[]): MoneroTxWallet;
    setOutputs(outputs: MoneroOutput[]): MoneroTxWallet;
    setOutputIndices(outputIndices: number[]): MoneroTxWallet;
    setMetadata(metadata: string): MoneroTxWallet;
    setExtra(extra: Uint8Array): MoneroTxWallet;
    setRctSignatures(rctSignatures: any): MoneroTxWallet;
    setRctSigPrunable(rctSigPrunable: any): MoneroTxWallet;
    setIsKeptByBlock(isKeptByBlock: boolean): MoneroTxWallet;
    setIsFailed(isFailed: boolean): MoneroTxWallet;
    setLastFailedHeight(lastFailedHeight: number): MoneroTxWallet;
    setLastFailedHash(lastFailedHash: string): MoneroTxWallet;
    setMaxUsedBlockHeight(maxUsedBlockHeight: number): MoneroTxWallet;
    setMaxUsedBlockHash(maxUsedBlockHash: string): MoneroTxWallet;
    setSignatures(signatures: string[]): MoneroTxWallet;
}
