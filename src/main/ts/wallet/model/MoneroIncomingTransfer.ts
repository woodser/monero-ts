import assert from "assert";
import GenUtils from "../../common/GenUtils";
import MoneroTransfer from "./MoneroTransfer";
import MoneroTxWallet from "./MoneroTxWallet";

/**
 * Models an incoming transfer of funds to the wallet.
 */
export default class MoneroIncomingTransfer extends MoneroTransfer {

  subaddressIndex: number;
  address: string;
  numSuggestedConfirmations: number;
  
  /**
   * Construct the transfer.
   * 
   * @param {MoneroTransfer} [transfer] is existing state to initialize from (optional)
   */
  constructor(transfer?: Partial<MoneroIncomingTransfer>) {
    super(transfer);
  }
  
  getIsIncoming(): boolean {
    return true;
  }
  
  getSubaddressIndex(): number {
    return this.subaddressIndex;
  }
  
  setSubaddressIndex(subaddressIndex: number): MoneroIncomingTransfer {
    this.subaddressIndex = subaddressIndex;
    return this;
  }
  
  getAddress(): string {
    return this.address;
  }

  setAddress(address: string): MoneroIncomingTransfer {
    this.address = address;
    return this;
  }
  
  /**
   * Return how many confirmations till it's not economically worth re-writing the chain.
   * That is, the number of confirmations before the transaction is highly unlikely to be
   * double spent or overwritten and may be considered settled, e.g. for a merchant to trust
   * as finalized.
   * 
   * @return {number} is the number of confirmations before it's not worth rewriting the chain
   */
  getNumSuggestedConfirmations(): number {
    return this.numSuggestedConfirmations;
  }
  
  setNumSuggestedConfirmations(numSuggestedConfirmations: number): MoneroIncomingTransfer {
    this.numSuggestedConfirmations = numSuggestedConfirmations;
    return this;
  }

  copy(): MoneroIncomingTransfer {
    return new MoneroIncomingTransfer(this.toJson());
  }
  
  /**
   * Updates this transaction by merging the latest information from the given
   * transaction.
   * 
   * Merging can modify or build references to the transfer given so it
   * should not be re-used or it should be copied before calling this method.
   * 
   * @param {MoneroIncomingTransfer} transfer is the transfer to merge into this one
   * @return {MoneroIncomingTransfer}
   */
  merge(transfer: MoneroIncomingTransfer): MoneroIncomingTransfer {
    super.merge(transfer);
    assert(transfer instanceof MoneroIncomingTransfer);
    if (this === transfer) return this;
    this.setSubaddressIndex(GenUtils.reconcile(this.getSubaddressIndex(), transfer.getSubaddressIndex()));
    this.setAddress(GenUtils.reconcile(this.getAddress(), transfer.getAddress()));
    this.setNumSuggestedConfirmations(GenUtils.reconcile(this.getNumSuggestedConfirmations(), transfer.getNumSuggestedConfirmations(), {resolveMax: false}));
    return this;
  }
  
  toString(indent = 0) {
    let str = super.toString(indent) + "\n";
    str += GenUtils.kvLine("Subaddress index", this.getSubaddressIndex(), indent);
    str += GenUtils.kvLine("Address", this.getAddress(), indent);
    str += GenUtils.kvLine("Num suggested confirmations", this.getNumSuggestedConfirmations(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }

  // -------------------- OVERRIDE COVARIANT RETURN TYPES ---------------------

  setTx(tx: MoneroTxWallet): MoneroIncomingTransfer {
    super.setTx(tx);
    return this;
  }
  
  setAmount(amount: bigint): MoneroIncomingTransfer {
    super.setAmount(amount);
    return this;
  }
  
  setAccountIndex(accountIndex: number): MoneroIncomingTransfer {
    super.setAccountIndex(accountIndex);
    return this;
  }
}
