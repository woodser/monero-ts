export = MoneroCheckReserve;
/**
 * Results from checking a reserve proof.
 *
 * @extends {MoneroCheck}
 */
declare class MoneroCheckReserve extends MoneroCheck {
    toJson(): any;
    getTotalAmount(): any;
    setTotalAmount(totalAmount: any): this;
    getUnconfirmedSpentAmount(): any;
    setUnconfirmedSpentAmount(unconfirmedSpentAmount: any): this;
}
import MoneroCheck = require("./MoneroCheck");
