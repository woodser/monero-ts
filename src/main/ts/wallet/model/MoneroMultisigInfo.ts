/**
 * Models information about a multisig wallet.
 */
export default class MoneroMultisigInfo {

  isMultisig: boolean;
  isReady: boolean;
  threshold: number;
  numParticipants: number;
  
  constructor(multisigInfo?: Partial<MoneroMultisigInfo>) {
    Object.assign(this, multisigInfo);
  }
  
  toJson(): any {
    return Object.assign({}, this);
  }
  
  getIsMultisig(): boolean {
    return this.isMultisig;
  }
  
  setIsMultisig(isMultisig: boolean): MoneroMultisigInfo {
    this.isMultisig = isMultisig;
    return this;
  }
  
  getIsReady(): boolean {
    return this.isReady;
  }
  
  setIsReady(isReady: boolean): MoneroMultisigInfo {
    this.isReady = isReady;
    return this;
  }
  
  getThreshold(): number {
    return this.threshold;
  }
  
  setThreshold(threshold: number): MoneroMultisigInfo {
    this.threshold = threshold;
    return this;
  }
  
  getNumParticipants(): number {
    return this.numParticipants;
  }
  
  setNumParticipants(numParticipants: number): MoneroMultisigInfo {
    this.numParticipants = numParticipants;
    return this;
  }
}
