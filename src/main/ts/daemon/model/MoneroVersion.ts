/**
 * Models a Monero version.
 */
export default class MoneroVersion {

  number: number;
  isRelease: boolean;
  
  constructor(number: number, isRelease: boolean) {
    this.number = number;
    this.isRelease = isRelease;
  }

  getNumber(): number {
    return this.number;
  }

  setNumber(number: number): MoneroVersion {
    this.number = number;
    return this;
  }

  getIsRelease(): boolean {
    return this.isRelease;
  }

  setIsRelease(isRelease: boolean): MoneroVersion {
    this.isRelease = isRelease;
    return this;
  }
  
  copy(): MoneroVersion {
    return new MoneroVersion(this.number, this.isRelease);
  }
  
  toJson(): any {
    return Object.assign({}, this);
  }
}
