export = MoneroCheckTx;
/**
 * Results from checking a transaction key.
 *
 * @extends {MoneroCheck}
 */
declare class MoneroCheckTx extends MoneroCheck {
    toJson(): any;
    inTxPool(): any;
    setInTxPool(inTxPool: any): this;
    getNumConfirmations(): any;
    setNumConfirmations(numConfirmations: any): this;
    getReceivedAmount(): any;
    setReceivedAmount(receivedAmount: any): this;
}
import MoneroCheck = require("./MoneroCheck");
