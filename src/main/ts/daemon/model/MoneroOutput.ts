import assert from "assert";
import GenUtils from "../../common/GenUtils";
import MoneroError from "../../common/MoneroError";
import MoneroKeyImage from "./MoneroKeyImage";
import MoneroTx from "./MoneroTx";

/**
 * Models a Monero transaction output.
 */
export default class MoneroOutput {

  tx: MoneroTx;
  keyImage: Partial<MoneroKeyImage>;
  amount: bigint;
  index: number;
  ringOutputIndices: number[];
  stealthPublicKey: string;
  
  /**
   * Construct the model.
   * 
   * @param {MoneroOutput} [output] is existing state to initialize from (optional)
   */
  constructor(output?: Partial<MoneroOutput>) {
    Object.assign(this, output);

    // deserialize fields if necessary
    if (this.amount !== undefined && typeof this.amount !== "bigint") this.amount = BigInt(this.amount);
    if (this.keyImage) this.keyImage = this.keyImage instanceof MoneroKeyImage ? this.keyImage.copy() : new MoneroKeyImage(this.keyImage);
  }
  
  getTx(): MoneroTx {
    return this.tx;
  }
  
  setTx(tx: MoneroTx): MoneroOutput {
    this.tx = tx;
    return this;
  }
  
  getKeyImage(): MoneroKeyImage {
    return this.keyImage as MoneroKeyImage;
  }

  setKeyImage(keyImage: MoneroKeyImage): MoneroOutput {
    this.keyImage = keyImage === undefined ? undefined : keyImage instanceof MoneroKeyImage ? keyImage : new MoneroKeyImage(keyImage);
    return this;
  }
  
  getAmount(): bigint {
    return this.amount;
  }

  setAmount(amount: bigint): MoneroOutput {
    this.amount = amount;
    return this;
  }
  
  getIndex(): number {
    return this.index;
  }
  
  setIndex(index: number): MoneroOutput {
    this.index = index;
    return this;
  }
  
  getRingOutputIndices(): number[] {
    return this.ringOutputIndices;
  }
  
  setRingOutputIndices(ringOutputIndices: number[]): MoneroOutput {
    this.ringOutputIndices = ringOutputIndices;
    return this;
  }
  
  getStealthPublicKey(): string {
    return this.stealthPublicKey;
  }
  
  setStealthPublicKey(stealthPublicKey: string): MoneroOutput {
    this.stealthPublicKey = stealthPublicKey;
    return this;
  }
  
  copy(): MoneroOutput {
    return new MoneroOutput(this);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (this.getAmount() !== undefined) json.amount = this.getAmount().toString();
    if (this.getKeyImage() !== undefined) json.keyImage = this.getKeyImage() ? this.getKeyImage().toJson() : undefined;
    delete json.tx;
    return json;
  }
  
  merge(output: MoneroOutput): MoneroOutput {
    assert(output instanceof MoneroOutput);
    if (this === output) return this;
    
    // merge txs if they're different which comes back to merging outputs
    if (this.getTx() !== output.getTx()) this.getTx().merge(output.getTx());
    
    // otherwise merge output fields
    else {
      if (this.getKeyImage() === undefined) this.setKeyImage(output.getKeyImage());
      else if (output.getKeyImage() !== undefined) this.getKeyImage().merge(output.getKeyImage());
      this.setAmount(GenUtils.reconcile(this.getAmount(), output.getAmount()));
      this.setIndex(GenUtils.reconcile(this.getIndex(), output.getIndex()));
    }

    return this;
  }
  
  toString(indent = 0): string {
    let str = "";
    if (this.getKeyImage() !== undefined) {
      str += GenUtils.kvLine("Key image", "", indent);
      str += this.getKeyImage().toString(indent + 1) + "\n";
    }
    str += GenUtils.kvLine("Amount", this.getAmount(), indent);
    str += GenUtils.kvLine("Index", this.getIndex(), indent);
    str += GenUtils.kvLine("Ring output indices", this.getRingOutputIndices(), indent);
    str += GenUtils.kvLine("Stealth public key", this.getStealthPublicKey(), indent);
    return str === "" ? str : str.slice(0, str.length - 1);  // strip last newline
  }
}