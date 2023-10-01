/**
 * Monero address book entry model
 */
export default class MoneroAddressBookEntry {
    index: number;
    address: string;
    description: string;
    paymentId: string;
    constructor(entry?: Partial<MoneroAddressBookEntry>);
    toJson(): any;
    getIndex(): number;
    setIndex(index: number): MoneroAddressBookEntry;
    getAddress(): string;
    setAddress(address: string): MoneroAddressBookEntry;
    getDescription(): string;
    setDescription(description: string): MoneroAddressBookEntry;
    getPaymentId(): string;
    setPaymentId(paymentId: string): MoneroAddressBookEntry;
}
