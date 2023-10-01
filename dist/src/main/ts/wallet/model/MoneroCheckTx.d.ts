import MoneroCheck from "./MoneroCheck";
/**
 * Results from checking a transaction key.
 */
export default class MoneroCheckTx extends MoneroCheck {
    inTxPool: boolean;
    numConfirmations: number;
    receivedAmount: bigint;
    constructor(check?: Partial<MoneroCheckTx>);
    toJson(): any;
    getInTxPool(): boolean;
    setInTxPool(inTxPool: boolean): MoneroCheckTx;
    getNumConfirmations(): number;
    setNumConfirmations(numConfirmations: number): MoneroCheckTx;
    getReceivedAmount(): bigint;
    setReceivedAmount(receivedAmount: bigint): MoneroCheckTx;
}
