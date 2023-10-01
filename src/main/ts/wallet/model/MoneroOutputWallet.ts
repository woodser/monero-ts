import assert from "assert";
import GenUtils from "../../common/GenUtils";
import MoneroError from "../../common/MoneroError";
import MoneroKeyImage from "../../daemon/model/MoneroKeyImage";
import MoneroOutput from "../../daemon/model/MoneroOutput";
import MoneroTx from "../../daemon/model/MoneroTx";
import MoneroTxWallet from "./MoneroTxWallet";

/**
 * Models a Monero output with wallet extensions.
 */
export default class MoneroOutputWallet extends MoneroOutput {

  accountIndex: number;
  subaddressIndex: number;
  isSpent: boolean;
  isFrozen: boolean;
  isLocked: boolean;

  /**
   * Construct the model.
   * 
   * @param {MoneroOutputWallet} [output] is existing state to initialize from (optional)
   */
  constructor(output?: Partial<MoneroOutputWallet>) {
    super(output);
  }

  getTx(): MoneroTxWallet {
    return super.getTx() as MoneroTxWallet;
  }
  
  setTx(tx: MoneroTx): MoneroOutputWallet {
    if (tx !== undefined && !(tx instanceof MoneroTxWallet)) throw new MoneroError("Wallet output's transaction must be of type MoneroTxWallet");
    super.setTx(tx);
    return this;
  }
  
  getAccountIndex(): number {
    return this.accountIndex;
  }

  setAccountIndex(accountIndex: number): MoneroOutputWallet {
    this.accountIndex = accountIndex;
    return this;
  }

  getSubaddressIndex(): number {
    return this.subaddressIndex;
  }

  setSubaddressIndex(subaddressIndex: number): MoneroOutputWallet {
    this.subaddressIndex = subaddressIndex;
    return this;
  }
  
  getIsSpent(): boolean {
    return this.isSpent;
  }

  setIsSpent(isSpent: boolean): MoneroOutputWallet {
    this.isSpent = isSpent;
    return this;
  }
  
  /**
   * Indicates if this output has been deemed 'malicious' and will therefore
   * not be spent by the wallet.
   * 
   * @return Boolean is whether or not this output is frozen
   */
  getIsFrozen(): boolean {
    return this.isFrozen;
  }

  setIsFrozen(isFrozen: boolean): MoneroOutputWallet {
    this.isFrozen = isFrozen;
    return this;
  }
  
  getIsLocked(): boolean {
    if (this.getTx() === undefined) return undefined;
    return (this.getTx() as MoneroTxWallet).getIsLocked();
  }
  
  copy(): MoneroOutputWallet {
    return new MoneroOutputWallet(this.toJson());
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this, super.toJson());
    delete json.tx;
    return json;
  }
  
  /**
   * Updates this output by merging the latest information from the given
   * output.
   * 
   * Merging can modify or build references to the output given so it
   * should not be re-used or it should be copied before calling this method.
   * 
   * @param output is the output to merge into this one
   */
  merge(output: MoneroOutputWallet): MoneroOutputWallet {
    assert(output instanceof MoneroOutputWallet);
    if (this === output) return;
    super.merge(output);
    this.setAccountIndex(GenUtils.reconcile(this.getAccountIndex(), output.getAccountIndex()));
    this.setSubaddressIndex(GenUtils.reconcile(this.getSubaddressIndex(), output.getSubaddressIndex()));
    this.setIsSpent(GenUtils.reconcile(this.getIsSpent(), output.getIsSpent(), {resolveTrue: true})); // output can become spent
    this.setIsFrozen(GenUtils.reconcile(this.getIsFrozen(), output.getIsFrozen()));
    return this;
  }
  
  toString(indent = 0): string {
    let str = super.toString(indent) + "\n"
    str += GenUtils.kvLine("Account index", this.getAccountIndex(), indent);
    str += GenUtils.kvLine("Subaddress index", this.getSubaddressIndex(), indent);
    str += GenUtils.kvLine("Is spent", this.getIsSpent(), indent);
    str += GenUtils.kvLine("Is frozen", this.getIsFrozen(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }

  // -------------------- OVERRIDE COVARIANT RETURN TYPES ---------------------

  setKeyImage(keyImage: MoneroKeyImage): MoneroOutputWallet {
    super.setKeyImage(keyImage);
    return this;
  }
  
  setAmount(amount: bigint): MoneroOutputWallet {
    super.setAmount(amount);
    return this;
  }
  
  setIndex(index: number): MoneroOutputWallet {
    super.setIndex(index);
    return this;
  }
  
  setRingOutputIndices(ringOutputIndices: number[]): MoneroOutputWallet {
    super.setRingOutputIndices(ringOutputIndices);
    return this;
  }
  
  setStealthPublicKey(stealthPublicKey: string): MoneroOutputWallet {
    super.setStealthPublicKey(stealthPublicKey);
    return this;
  }
}
