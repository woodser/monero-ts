/**
 * Monero integrated address model.
 */
export default class MoneroIntegratedAddress {
  
  standardAddress: string;
  paymentId: string;
  integratedAddress: string;
  
  constructor(integratedAddress?: Partial<MoneroIntegratedAddress>) {
    Object.assign(this, integratedAddress);
  }
  
  toJson(): any {
    return Object.assign({}, this);
  }

  getStandardAddress(): string {
    return this.standardAddress;
  }
  
  setStandardAddress(standardAddress: string): MoneroIntegratedAddress {
    this.standardAddress = standardAddress;
    return this;
  }
  
  getPaymentId(): string {
    return this.paymentId;
  }
  
  setPaymentId(paymentId: string): MoneroIntegratedAddress {
    this.paymentId = paymentId;
    return this;
  }
  
  getIntegratedAddress(): string {
    return this.integratedAddress;
  }
  
  setIntegratedAddress(integratedAddress: string): MoneroIntegratedAddress {
    this.integratedAddress = integratedAddress;
    return this;
  }
  
  toString(): string {
    return this.integratedAddress;
  }
}
