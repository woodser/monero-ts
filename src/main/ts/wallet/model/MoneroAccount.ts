import assert from "assert";
import GenUtils from "../../common/GenUtils";
import MoneroSubaddress from "./MoneroSubaddress";

/**
 * Monero account model.
 */
export default class MoneroAccount {

  index: number;
  primaryAddress: string;
  balance: bigint;
  unlockedBalance: bigint;
  label: string;
  tag: string;
  subaddresses: MoneroSubaddress[];
  
  constructor(account?: Partial<MoneroAccount>) {
    Object.assign(this, account);

    // deserialize balances
    if (this.balance !== undefined && typeof this.balance !== "bigint") this.balance = BigInt(this.balance);
    if (this.unlockedBalance !== undefined && typeof this.unlockedBalance !== "bigint") this.unlockedBalance = BigInt(this.unlockedBalance);

    // copy subaddresses
    if (this.subaddresses) {
      for (let i = 0; i < this.subaddresses.length; i++) {
        this.subaddresses[i] = new MoneroSubaddress(this.subaddresses[i]);
      }
    }
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (json.balance !== undefined) json.balance = json.balance.toString();
    if (json.unlockedBalance !== undefined) json.unlockedBalance = json.unlockedBalance.toString();
    if (json.subaddresses !== undefined) {
      for (let i = 0; i < json.subaddresses.length; i++) {
        json.subaddresses[i] = json.subaddresses[i].toJson();
      }
    }
    return json;
  }
  
  getIndex(): number {
    return this.index;
  }
  
  setIndex(index: number): MoneroAccount {
    this.index = index;
    return this;
  }
  
  getPrimaryAddress(): string {
    return this.primaryAddress;
  }

  setPrimaryAddress(primaryAddress: string): MoneroAccount {
    this.primaryAddress = primaryAddress;
    return this;
  }
  
  getBalance(): bigint {
    return this.balance;
  }
  
  setBalance(balance: bigint): MoneroAccount {
    this.balance = balance;
    return this;
  }
  
  getUnlockedBalance(): bigint {
    return this.unlockedBalance;
  }
  
  setUnlockedBalance(unlockedBalance: bigint): MoneroAccount {
    this.unlockedBalance = unlockedBalance;
    return this;
  }

  getLabel(): string {
    return this.label;
  }
  
  setLabel(label: string): MoneroAccount {
    this.label = label;
    return this;
  }
  
  getTag(): string {
    return this.tag;
  }
  
  setTag(tag: string): MoneroAccount {
    this.tag = tag;
    return this;
  }
  
  getSubaddresses(): MoneroSubaddress[] {
    return this.subaddresses;
  }
  
  setSubaddresses(subaddresses: MoneroSubaddress[]): MoneroAccount  {
    assert(subaddresses === undefined || Array.isArray(subaddresses), "Given subaddresses must be undefined or an array of subaddresses");
    this.subaddresses = subaddresses;
    if (subaddresses) {
      for (let subaddress of subaddresses) {
        subaddress.setAccountIndex(this.index);
      }
    }
    return this;
  }
  
  toString(indent = 0): string {
    let str = "";
    str += GenUtils.kvLine("Index", this.getIndex(), indent);
    str += GenUtils.kvLine("Primary address", this.getPrimaryAddress(), indent);
    str += GenUtils.kvLine("Balance", this.getBalance(), indent);
    str += GenUtils.kvLine("Unlocked balance", this.getUnlockedBalance(), indent);
    str += GenUtils.kvLine("Label", this.getTag(), indent);
    str += GenUtils.kvLine("Tag", this.getTag(), indent);
    if (this.getSubaddresses() !== undefined) {
      str += GenUtils.kvLine("Subaddresses", "", indent)
      for (let i = 0; i < this.getSubaddresses().length; i++) {
        str += GenUtils.kvLine(i + 1, "", indent + 1);
        str += this.getSubaddresses()[i].toString(indent + 2) + "\n";
      }
    }
    return str.slice(0, str.length - 1);  // strip last newline
  }
}
