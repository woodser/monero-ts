import assert from "assert";
import GenUtils from "../../common/GenUtils";
import MoneroError from "../../common/MoneroError";
import MoneroTxWallet from "./MoneroTxWallet";

/**
 * Models a base transfer of funds to or from the wallet.
 */
export default class MoneroTransfer {

  tx: MoneroTxWallet;
  accountIndex: number;
  amount: bigint;
  
  /**
   * Construct the transfer.
   * 
   * @param {Partial<MoneroTransfer>} transfer existing state to initialize from (optional)
   */
  constructor(transfer: Partial<MoneroTransfer>) {
    Object.assign(this, transfer);
    if (this.amount !== undefined && typeof this.amount !== "bigint") this.amount = BigInt(this.amount);
    this.validate();
  }
  
  copy(): MoneroTransfer {
    return new MoneroTransfer(this);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (this.getAmount() !== undefined) json.amount = this.getAmount().toString()
    delete json.tx; // parent tx is not serialized
    return json;
  }
  
  getTx(): MoneroTxWallet {
    return this.tx;
  }
  
  setTx(tx: MoneroTxWallet): MoneroTransfer {
    this.tx = tx;
    return this;
  }
  
  getIsOutgoing(): boolean {
    let isIncoming = this.getIsIncoming();
    assert(typeof isIncoming === "boolean");
    return !isIncoming;
  }
  
  getIsIncoming(): boolean {
    throw new Error("Subclass must implement");
  }

  getAccountIndex(): number {
    return this.accountIndex;
  }

  setAccountIndex(accountIndex: number): MoneroTransfer {
    this.accountIndex = accountIndex;
    this.validate();
    return this;
  }

  getAmount(): bigint {
    return this.amount;
  }

  setAmount(amount: bigint): MoneroTransfer {
    this.amount = amount;
    return this;
  }
  
  /**
   * Updates this transaction by merging the latest information from the given
   * transaction.
   * 
   * Merging can modify or build references to the transfer given so it
   * should not be re-used or it should be copied before calling this method.
   * 
   * @param transfer is the transfer to merge into this one
   * @return {MoneroTransfer} the merged transfer
   */
  merge(transfer: MoneroTransfer): MoneroTransfer {
    assert(transfer instanceof MoneroTransfer);
    if (this === transfer) return this;
    
    // merge transactions if they're different which comes back to merging transfers
    if (this.getTx() !== transfer.getTx()) {
      this.getTx().merge(transfer.getTx());
      return this;
    }
    
    // otherwise merge transfer fields
    this.setAccountIndex(GenUtils.reconcile(this.getAccountIndex(), transfer.getAccountIndex()));
    
    // TODO monero-project: failed tx in pool (after testUpdateLockedDifferentAccounts()) causes non-originating saved wallets to return duplicate incoming transfers but one has amount of 0
    if (this.getAmount() !== undefined && transfer.getAmount() !== undefined && this.getAmount() !== transfer.getAmount() && (this.getAmount() === 0n || transfer.getAmount() === 0n)) {
      console.warn("monero-project returning transfers with 0 amount/numSuggestedConfirmations");
    } else {
      this.setAmount(GenUtils.reconcile(this.getAmount(), transfer.getAmount()));
    }
    
    return this;
  }
  
  toString(indent = 0): string {
    let str = "";
    str += GenUtils.kvLine("Is incoming", this.getIsIncoming(), indent);
    str += GenUtils.kvLine("Account index", this.getAccountIndex(), indent);
    str += GenUtils.kvLine("Amount", this.getAmount() ? this.getAmount().toString() : undefined, indent);
    return str === "" ? str :  str.slice(0, str.length - 1);  // strip last newline
  }
  
  protected validate() {
    if (this.getAccountIndex() !== undefined && this.getAccountIndex() < 0) throw new MoneroError("Account index must be >= 0");
  }
}
