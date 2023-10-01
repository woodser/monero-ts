import GenUtils from "../../common/GenUtils";
import MoneroError from "../../common/MoneroError";

/**
 * Models an outgoing transfer destination.
 */
export default class MoneroDestination {

  address: string;
  amount: bigint;

  /**
   * Construct a destination to send funds to.
   * 
   * @param {Partial<MoneroDestination>|string} destinationOrAddress is a MoneroDestination or hex string to initialize from (optional)
   * @param {bigint} [amount] - the destination amount
   */
  constructor(destinationOrAddress?: Partial<MoneroDestination> | string, amount?: bigint) {
    if (typeof destinationOrAddress === "string") {
      this.setAddress(destinationOrAddress);
      this.setAmount(amount);
    } else {
      if (amount !== undefined) throw new Error("Amount parameter must be undefined when initializing a MoneroDestination from a MoneroDestination")
      Object.assign(this, destinationOrAddress);
      if (this.amount && typeof this.amount !== "bigint") this.amount = BigInt(this.amount);
    }
  }
  
  getAddress(): string {
    return this.address;
  }

  setAddress(address: string | undefined): MoneroDestination {
    this.address = address;
    return this;
  }
  
  getAmount(): bigint {
    return this.amount;
  }

  setAmount(amount: bigint): MoneroDestination {
    if (amount !== undefined && typeof amount !== "bigint") {
      if (typeof amount === "number") throw new MoneroError("Destination amount must be BigInt or string");
      try { amount = BigInt(amount); }
      catch (err) { throw new MoneroError("Invalid destination amount: " + amount); }
    }
    this.amount = amount;
    return this;
  }

  copy(): MoneroDestination {
    return new MoneroDestination(this);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (this.getAmount() !== undefined) json.amount = this.getAmount().toString();
    return json;
  }
  
  toString(indent = 0): string {
    let str = GenUtils.kvLine("Address", this.getAddress(), indent);
    str += GenUtils.kvLine("Amount", this.getAmount() ? this.getAmount().toString() : undefined, indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
}