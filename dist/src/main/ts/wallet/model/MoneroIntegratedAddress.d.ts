/**
 * Monero integrated address model.
 */
export default class MoneroIntegratedAddress {
    standardAddress: string;
    paymentId: string;
    integratedAddress: string;
    constructor(integratedAddress?: Partial<MoneroIntegratedAddress>);
    toJson(): any;
    getStandardAddress(): string;
    setStandardAddress(standardAddress: string): MoneroIntegratedAddress;
    getPaymentId(): string;
    setPaymentId(paymentId: string): MoneroIntegratedAddress;
    getIntegratedAddress(): string;
    setIntegratedAddress(integratedAddress: string): MoneroIntegratedAddress;
    toString(): string;
}
