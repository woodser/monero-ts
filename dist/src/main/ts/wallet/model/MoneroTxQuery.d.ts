import MoneroBlock from "../../daemon/model/MoneroBlock";
import MoneroOutput from "../../daemon/model/MoneroOutput";
import MoneroIncomingTransfer from "./MoneroIncomingTransfer";
import MoneroOutgoingTransfer from "./MoneroOutgoingTransfer";
import MoneroOutputQuery from "./MoneroOutputQuery";
import MoneroTransferQuery from "./MoneroTransferQuery";
import MoneroTxSet from "./MoneroTxSet";
import MoneroTxWallet from "./MoneroTxWallet";
/**
 * <p>Configuration to query transactions.</p>
 */
export default class MoneroTxQuery extends MoneroTxWallet {
    hash: string;
    hashes: string[];
    height: number;
    minHeight: number;
    maxHeight: number;
    includeOutputs: boolean;
    isConfirmed: boolean;
    inTxPool: boolean;
    relay: boolean;
    isRelayed: boolean;
    isFailed: boolean;
    isMinerTx: boolean;
    isLocked: boolean;
    isIncoming: boolean;
    isOutgoing: boolean;
    paymentId: string;
    paymentIds: string[];
    hasPaymentId: boolean;
    transferQuery: Partial<MoneroTransferQuery>;
    inputQuery: Partial<MoneroOutputQuery>;
    outputQuery: Partial<MoneroOutputQuery>;
    /**
     * <p>Construct the transaction query.</p>
     *
     * <p>Example:</p>
     *
     * <code>
     * &sol;&sol; get transactions with unlocked incoming transfers to account 0<br>
     * let txs = await wallet.getTxs({<br>
     * &nbsp;&nbsp; isLocked: false,<br>
     * &nbsp;&nbsp; transferQuery: {<br>
     * &nbsp;&nbsp;&nbsp;&nbsp; isIncoming: true,<br>
     * &nbsp;&nbsp;&nbsp;&nbsp; accountIndex: 0<br>
     * &nbsp;&nbsp; }<br>
     * });
     * </code>
     *
     * <p>All configuration is optional.  All transactions are returned except those that don't meet criteria defined in this query.</p>
     *
     * @param {MoneroTxQuery} [query] - tx query configuration
     * @param {string} [query.hash] - get a tx with this hash
     * @param {string[]} [query.txHashes] - get txs with these hashes
     * @param {number} [query.height] - get txs with this height
     * @param {number} [query.minHeight] - get txs with height greater than or equal to this height
     * @param {number} [query.maxHeight] - get txs with height less than or equal to this height
     * @param {boolean} [query.isConfirmed] - get confirmed or unconfirmed txs
     * @param {boolean} [query.inTxPool] - get txs in or out of the tx pool
     * @param {boolean} [query.relay] - get txs with the same relay status
     * @param {boolean} [query.isRelayed] - get relayed or non-relayed txs
     * @param {boolean} [query.isFailed] - get failed or non-failed txs
     * @param {boolean} [query.isMinerTx] - get miner or non-miner txs
     * @param {boolean} [query.isLocked] - get locked or unlocked txs
     * @param {boolean} [query.isIncoming] - get txs with or without incoming transfers
     * @param {boolean} [query.isOutgoing] - get txs with or without outgoing transfers
     * @param {string} [query.paymentId] - get txs with this payment ID
     * @param {string} [query.paymentIds] - get txs with a payment ID among these payment IDs
     * @param {boolean} [query.hasPaymentId] - get txs with or without payment IDs
     * @param {Partial<MoneroTransferQuery>} [query.transferQuery] - get txs with transfers matching this transfer query
     * @param {Partial<MoneroOutputQuery>} [query.inputQuery] - get txs with inputs matching this input query
     * @param {Partial<MoneroOutputQuery>} [query.outputQuery] - get txs with outputs matching this output query
     */
    constructor(query?: Partial<MoneroTxQuery>);
    copy(): MoneroTxQuery;
    toJson(): any;
    getIsIncoming(): boolean;
    setIsIncoming(isIncoming: boolean): MoneroTxQuery;
    getIsOutgoing(): boolean;
    setIsOutgoing(isOutgoing: boolean): MoneroTxQuery;
    getHashes(): string[];
    setHashes(hashes: string[]): MoneroTxQuery;
    setHash(hash: string): MoneroTxQuery;
    getHasPaymentId(): boolean;
    setHasPaymentId(hasPaymentId: boolean): MoneroTxQuery;
    getPaymentIds(): string[];
    setPaymentIds(paymentIds: string[]): MoneroTxQuery;
    setPaymentId(paymentId: string): MoneroTxQuery;
    getHeight(): number;
    setHeight(height: number): MoneroTxQuery;
    getMinHeight(): number;
    setMinHeight(minHeight: number): MoneroTxQuery;
    getMaxHeight(): number;
    setMaxHeight(maxHeight: number): MoneroTxQuery;
    getIncludeOutputs(): boolean;
    setIncludeOutputs(includeOutputs: boolean): MoneroTxQuery;
    getTransferQuery(): MoneroTransferQuery;
    setTransferQuery(transferQuery: MoneroTransferQuery): MoneroTxQuery;
    getInputQuery(): MoneroOutputQuery;
    setInputQuery(inputQuery: MoneroOutputQuery): MoneroTxQuery;
    getOutputQuery(): MoneroOutputQuery;
    setOutputQuery(outputQuery: MoneroOutputQuery): MoneroTxQuery;
    meetsCriteria(tx: MoneroTxWallet, queryChildren?: boolean): boolean;
    setIncomingTransfers(incomingTransfers: MoneroIncomingTransfer[]): MoneroTxQuery;
    setOutgoingTransfer(outgoingTransfer: MoneroOutgoingTransfer): MoneroTxQuery;
    setOutputs(outputs: MoneroOutput[]): MoneroTxQuery;
    setNote(note: string): MoneroTxQuery;
    setIsLocked(isLocked: boolean): MoneroTxQuery;
    setBlock(block: MoneroBlock): MoneroTxQuery;
    setVersion(version: number): MoneroTxQuery;
    setIsMinerTx(isMinerTx: boolean): MoneroTxQuery;
    setFee(fee: bigint): MoneroTxQuery;
    setRingSize(ringSize: number): MoneroTxQuery;
    setRelay(relay: boolean): MoneroTxQuery;
    setIsRelayed(isRelayed: boolean): MoneroTxQuery;
    setIsConfirmed(isConfirmed: boolean): MoneroTxQuery;
    setInTxPool(inTxPool: boolean): MoneroTxQuery;
    setNumConfirmations(numConfirmations: number): MoneroTxQuery;
    setUnlockTime(unlockTime: bigint): MoneroTxQuery;
    setLastRelayedTimestamp(lastRelayedTimestamp: number): MoneroTxQuery;
    setReceivedTimestamp(receivedTimestamp: number): MoneroTxQuery;
    setIsDoubleSpendSeen(isDoubleSpendSeen: boolean): MoneroTxQuery;
    setKey(key: string): MoneroTxQuery;
    setFullHex(hex: string): MoneroTxQuery;
    setPrunedHex(prunedHex: string): MoneroTxQuery;
    setPrunableHex(prunableHex: string): MoneroTxQuery;
    setPrunableHash(prunableHash: string): MoneroTxQuery;
    setSize(size: number): MoneroTxQuery;
    setWeight(weight: number): MoneroTxQuery;
    setInputs(inputs: MoneroOutput[]): MoneroTxQuery;
    setOutputIndices(outputIndices: number[]): MoneroTxQuery;
    setMetadata(metadata: string): MoneroTxQuery;
    setTxSet(txSet: MoneroTxSet): MoneroTxQuery;
    setExtra(extra: Uint8Array): MoneroTxQuery;
    setRctSignatures(rctSignatures: any): MoneroTxQuery;
    setRctSigPrunable(rctSigPrunable: any): MoneroTxQuery;
    setIsKeptByBlock(isKeptByBlock: boolean): MoneroTxQuery;
    setIsFailed(isFailed: boolean): MoneroTxQuery;
    setLastFailedHeight(lastFailedHeight: number): MoneroTxQuery;
    setLastFailedHash(lastFailedId: string): MoneroTxQuery;
    setMaxUsedBlockHeight(maxUsedBlockHeight: number): MoneroTxQuery;
    setMaxUsedBlockHash(maxUsedBlockId: string): MoneroTxQuery;
    setSignatures(signatures: string[]): MoneroTxQuery;
}
