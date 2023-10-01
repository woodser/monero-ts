/**
 * Base class for results from checking a transaction or reserve proof.
 */
export default class MoneroCheck {

  isGood?: boolean;
  
  constructor(check?: Partial<MoneroCheck>) {
    Object.assign(this, check);
  }

  getIsGood(): boolean {
    return this.isGood;
  }

  setIsGood(isGood: boolean): MoneroCheck {
    this.isGood = isGood;
    return this;
  }
}
