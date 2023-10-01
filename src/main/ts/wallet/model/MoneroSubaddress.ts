import GenUtils from "../../common/GenUtils";

/**
 * Monero subaddress model.
 */
export default class MoneroSubaddress {

  accountIndex: number;
  index: number;
  address: string;
  label: string;
  balance: bigint;
  unlockedBalance: bigint;
  numUnspentOutputs: number;
  isUsed: boolean;
  numBlocksToUnlock: number;
  
  constructor(subaddress?: Partial<MoneroSubaddress>) {
    Object.assign(this, subaddress);
    if (this.balance !== undefined && typeof this.balance !== "bigint") this.balance = BigInt(this.balance);
    if (this.unlockedBalance !== undefined && typeof this.unlockedBalance !== "bigint") this.unlockedBalance = BigInt(this.unlockedBalance);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (json.balance !== undefined) json.balance = json.balance.toString();
    if (json.unlockedBalance !== undefined) json.unlockedBalance = json.unlockedBalance.toString();
    return json;
  }
  
  getAccountIndex(): number {
    return this.accountIndex;
  }

  setAccountIndex(accountIndex: number): MoneroSubaddress {
    this.accountIndex = accountIndex;
    return this;
  }

  getIndex(): number {
    return this.index;
  }

  setIndex(index: number): MoneroSubaddress {
    this.index = index;
    return this;
  }
  
  getAddress(): string {
    return this.address;
  }

  setAddress(address: string): MoneroSubaddress {
    this.address = address;
    return this;
  }

  getLabel(): string {
    return this.label;
  }

  setLabel(label: string): MoneroSubaddress {
    this.label = label;
    return this;
  }

  getBalance(): bigint {
    return this.balance;
  }

  setBalance(balance: bigint): MoneroSubaddress {
    this.balance = balance;
    return this;
  }

  getUnlockedBalance(): bigint {
    return this.unlockedBalance;
  }

  setUnlockedBalance(unlockedBalance: bigint): MoneroSubaddress {
    this.unlockedBalance = unlockedBalance;
    return this;
  }

  getNumUnspentOutputs(): number {
    return this.numUnspentOutputs;
  }

  setNumUnspentOutputs(numUnspentOutputs: number): MoneroSubaddress {
    this.numUnspentOutputs = numUnspentOutputs;
    return this;
  }

  getIsUsed(): boolean {
    return this.isUsed;
  }

  setIsUsed(isUsed: boolean): MoneroSubaddress {
    this.isUsed = isUsed;
    return this;
  }

  getNumBlocksToUnlock(): number {
    return this.numBlocksToUnlock;
  }

  setNumBlocksToUnlock(numBlocksToUnlock: number): MoneroSubaddress {
    this.numBlocksToUnlock = numBlocksToUnlock;
    return this;
  }
  
  toString(indent = 0): string {
    let str = "";
    str += GenUtils.kvLine("Account index", this.getAccountIndex(), indent);
    str += GenUtils.kvLine("Subaddress index", this.getIndex(), indent);
    str += GenUtils.kvLine("Address", this.getAddress(), indent);
    str += GenUtils.kvLine("Label", this.getLabel(), indent);
    str += GenUtils.kvLine("Balance", this.getBalance(), indent);
    str += GenUtils.kvLine("Unlocked balance", this.getUnlockedBalance(), indent);
    str += GenUtils.kvLine("Num unspent outputs", this.getNumUnspentOutputs(), indent);
    str += GenUtils.kvLine("Is used", this.getIsUsed(), indent);
    str += GenUtils.kvLine("Num blocks to unlock", this.getNumBlocksToUnlock(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
}
