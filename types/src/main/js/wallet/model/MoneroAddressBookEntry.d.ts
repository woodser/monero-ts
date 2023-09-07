export = MoneroAddressBookEntry;
/**
 * Monero address book entry model
 */
declare class MoneroAddressBookEntry {
    constructor(state: any);
    state: any;
    toJson(): any;
    getIndex(): any;
    setIndex(index: any): this;
    getAddress(): any;
    setAddress(address: any): this;
    getDescription(): any;
    setDescription(description: any): this;
    getPaymentId(): any;
    setPaymentId(paymentId: any): this;
}
