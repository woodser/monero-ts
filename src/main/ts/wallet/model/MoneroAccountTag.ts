/**
 * Represents an account tag.
 */
export default class MoneroAccountTag {

  tag: string;
  label: string;
  accountIndices: number[];
  
  constructor(accountTag?: Partial<MoneroAccountTag>) {
    Object.assign(this, accountTag);
  }
  
  getTag(): string {
    return this.tag;
  }
  
  setTag(tag: string): MoneroAccountTag {
    this.tag = tag;
    return this;
  }
  
  getLabel(): string {
    return this.label;
  }
  
  setLabel(label: string): MoneroAccountTag {
    this.label = label;
    return this;
  }
  
  getAccountIndices(): number[] {
    return this.accountIndices;
  }
  
  setAccountIndices(accountIndices: number[]): MoneroAccountTag {
    this.accountIndices = accountIndices;
    return this;
  }
}
