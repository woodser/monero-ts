export = MoneroIntegratedAddress;
/**
 * Monero integrated address model.
 */
declare class MoneroIntegratedAddress {
    constructor(state: any);
    state: any;
    toJson(): any;
    getStandardAddress(): any;
    setStandardAddress(standardAddress: any): this;
    getPaymentId(): any;
    setPaymentId(paymentId: any): this;
    getIntegratedAddress(): any;
    setIntegratedAddress(integratedAddress: any): this;
    toString(): any;
}
