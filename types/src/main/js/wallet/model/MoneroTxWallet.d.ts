export = MoneroTxWallet;
/**
 * Models a Monero transaction with wallet extensions.
 *
 * @class
 * @extends {MoneroTx}
 */
declare class MoneroTxWallet extends MoneroTx {
    static _mergeIncomingTransfer(transfers: any, transfer: any): void;
    getTxSet(): any;
    setTxSet(txSet: any): this;
    isIncoming(): any;
    setIsIncoming(isIncoming: any): this;
    isOutgoing(): any;
    setIsOutgoing(isOutgoing: any): this;
    getIncomingAmount(): any;
    getOutgoingAmount(): any;
    getTransfers(transferQuery: any): any[];
    filterTransfers(transferQuery: any): any[];
    getIncomingTransfers(): any;
    setIncomingTransfers(incomingTransfers: any): this;
    getOutgoingTransfer(): any;
    setOutgoingTransfer(outgoingTransfer: any): this;
    getInputs(outputQuery: any): any;
    setInputs(inputs: any): this;
    getOutputs(outputQuery: any): any;
    setOutputs(outputs: any): this;
    filterOutputs(outputQuery: any): any[];
    getNote(): any;
    setNote(note: any): this;
    isLocked(): any;
    setIsLocked(isLocked: any): this;
    getInputSum(): any;
    setInputSum(inputSum: any): this;
    getOutputSum(): any;
    setOutputSum(outputSum: any): this;
    getChangeAddress(): any;
    setChangeAddress(changeAddress: any): this;
    getChangeAmount(): any;
    setChangeAmount(changeAmount: any): this;
    getNumDummyOutputs(): any;
    setNumDummyOutputs(numDummyOutputs: any): this;
    getExtraHex(): any;
    setExtraHex(extraHex: any): this;
    copy(): MoneroTxWallet;
    /**
     * Updates this transaction by merging the latest information from the given
     * transaction.
     *
     * Merging can modify or build references to the transaction given so it
     * should not be re-used or it should be copied before calling this method.
     *
     * @param tx is the transaction to merge into this transaction
     */
    merge(tx: any): this;
    toString(indent: number, oneLine: any): string;
}
import MoneroTx = require("../../daemon/model/MoneroTx");
