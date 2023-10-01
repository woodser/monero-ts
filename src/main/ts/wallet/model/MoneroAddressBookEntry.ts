/**
 * Monero address book entry model
 */
export default class MoneroAddressBookEntry {

  index: number;
  address: string;
  description: string;
  paymentId: string;
  
  constructor(entry?: Partial<MoneroAddressBookEntry>) {
    Object.assign(this, entry);
  }
  
  toJson(): any {
    return Object.assign({}, this);
  }
  
  getIndex(): number {
    return this.index;
  }
  
  setIndex(index: number): MoneroAddressBookEntry {
    this.index = index;
    return this;
  }
  
  getAddress(): string {
    return this.address;
  }
  
  setAddress(address: string): MoneroAddressBookEntry {
    this.address = address;
    return this;
  }
  
  getDescription(): string {
    return this.description;
  }
  
  setDescription(description: string): MoneroAddressBookEntry {
    this.description = description;
    return this;
  }
  
  getPaymentId(): string {
    return this.paymentId;
  }
  
  setPaymentId(paymentId: string): MoneroAddressBookEntry {
    this.paymentId = paymentId;
    return this;
  }
}
