import MoneroMessageSignatureType from "./MoneroMessageSignatureType";

/**
 * Message signature verification result.
 */
export default class MoneroMessageSignatureResult {

  isGood: boolean;
  isOld: boolean;
  signatureType: MoneroMessageSignatureType;
  version: number;
  
  constructor(result?: Partial<MoneroMessageSignatureResult>) {
    Object.assign(this, result);
  }
  
  toJson(): any {
    return Object.assign({}, this);
  }

  getIsGood(): boolean {
    return this.isGood;
  }

  setIsGood(isGood: boolean): MoneroMessageSignatureResult {
    this.isGood = isGood;
    return this;
  }
  
  getIsOld(): boolean {
    return this.isOld;
  }

  setIsOld(isOld: boolean): MoneroMessageSignatureResult {
    this.isOld = isOld;
    return this;
  }
  
  getSignatureType(): MoneroMessageSignatureType {
    return this.signatureType;
  }

  setSignatureType(signatureType: MoneroMessageSignatureType): MoneroMessageSignatureResult {
    this.signatureType = signatureType;
    return this;
  }
  
  getVersion(): number {
    return this.version;
  }

  setVersion(version: number): MoneroMessageSignatureResult {
    this.version = version;
    return this;
  }

}