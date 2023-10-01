import MoneroError from "../../common/MoneroError";
import MoneroKeyImage from "../../daemon/model/MoneroKeyImage";
import MoneroOutputWallet from "./MoneroOutputWallet";
import MoneroTx from "../../daemon/model/MoneroTx";
import MoneroTxWallet from "./MoneroTxWallet";
import MoneroTxQuery from "./MoneroTxQuery";

/**
 * Configuration to query wallet outputs.
 */
export default class MoneroOutputQuery extends MoneroOutputWallet {

  minAmount: bigint;
  maxAmount: bigint;
  txQuery: Partial<MoneroTxQuery>;
  subaddressIndices: number[];

  /**
   * <p>Construct the output query.</p>
   * 
   * <p>Example:</p>
   * 
   * <code>
   * &sol;&sol; get available outputs in account 0 with a minimum amount<br>
   * let outputs = await wallet.getOutputs({<br>
   * &nbsp;&nbsp; isSpent: false,<br>
   * &nbsp;&nbsp; isLocked: false,<br>
   * &nbsp;&nbsp; accountIndex: 0,<br>
   * &nbsp;&nbsp; minAmount: BigInt("750000")<br>
   * });
   * </code>
   * 
   * <p>All configuration is optional.  All outputs are returned except those that don't meet criteria defined in this query.</p>
   * 
   * @param {MoneroOutputQuery} [config] - output query configuration (optional)
   * @param {number} config.accountIndex - get outputs in this account index
   * @param {number} config.subaddressIndex - get outputs in this subaddress index
   * @param {number[]} config.subaddressIndices - get outputs in these subaddress indices
   * @param {bigint} config.amount - get outputs with this amount
   * @param {bigint} config.minAmount - get outputs with amount greater than or equal to this amount
   * @param {bigint} config.maxAmount - get outputs with amount less than or equal to this amount
   * @param {boolean} config.isSpent - get spent xor unspent outputs
   * @param {boolean} config.isFrozen - get frozen xor thawed outputs
   * @param {MoneroKeyImage} config.keyImage - get outputs with a key image matching fields defined in this key image
   * @param {string} config.keyImage.hex - get outputs with this key image hex
   * @param {string} config.keyImage.signature - get outputs with this key image signature
   * @param {MoneroTxQuery} config.txQuery - get outputs whose tx match this tx query
   */
  constructor(query?: Partial<MoneroOutputQuery>) {
    super(query);
    if (this.minAmount !== undefined && typeof this.minAmount !== "bigint") this.minAmount = BigInt(this.minAmount);
    if (this.maxAmount !== undefined && typeof this.maxAmount !== "bigint") this.maxAmount = BigInt(this.maxAmount);
    if (this.txQuery && !(this.txQuery instanceof MoneroTxQuery)) this.txQuery = new MoneroTxQuery(this.txQuery);
    if (this.txQuery) this.txQuery.setOutputQuery(this);
    if (this.isLocked !== undefined) throw new MoneroError("isLocked must be part of tx query, not output query");
  }
  
  copy(): MoneroOutputQuery {
    return new MoneroOutputQuery(this);
  }
  
  toJson(): any {
    let json = Object.assign({}, this, super.toJson());
    if (this.getMinAmount() !== undefined) json.minAmount = this.getMinAmount().toString();
    if (this.getMaxAmount() !== undefined) json.maxAmount = this.getMaxAmount().toString();
    delete json.txQuery;
    return json;
  }
  
  getMinAmount(): bigint {
    return this.minAmount;
  }

  setMinAmount(minAmount: bigint): MoneroOutputQuery {
    this.minAmount = minAmount;
    return this;
  }

  getMaxAmount(): bigint {
    return this.maxAmount;
  }

  setMaxAmount(maxAmount: bigint): MoneroOutputQuery {
    this.maxAmount = maxAmount;
    return this;
  }
  
  getTxQuery(): MoneroTxQuery {
    return this.txQuery as MoneroTxQuery;
  }
  
  setTxQuery(txQuery: MoneroTxQuery): MoneroOutputQuery {
    this.txQuery = txQuery === undefined ? undefined : txQuery instanceof MoneroTxQuery ? txQuery : new MoneroTxQuery(txQuery);
    if (txQuery) this.txQuery.outputQuery = this;
    return this;
  }
  
  getSubaddressIndices(): number[] {
    return this.subaddressIndices;
  }
  
  setSubaddressIndices(subaddressIndices: number[]): MoneroOutputQuery {
    this.subaddressIndices = subaddressIndices;
    return this;
  }
  
  meetsCriteria(output: MoneroOutputWallet, queryParent = true): boolean {
    if (!(output instanceof MoneroOutputWallet)) throw new Error("Output not given to MoneroOutputQuery.meetsCriteria(output)");
    
    // filter on output
    if (this.getAccountIndex() !== undefined && this.getAccountIndex() !== output.getAccountIndex()) return false;
    if (this.getSubaddressIndex() !== undefined && this.getSubaddressIndex() !== output.getSubaddressIndex()) return false;
    if (this.getAmount() !== undefined && this.getAmount() !== output.getAmount()) return false;
    if (this.getIsSpent() !== undefined && this.getIsSpent() !== output.getIsSpent()) return false;
    if (this.getIsFrozen() !== undefined && this.getIsFrozen() !== output.getIsFrozen()) return false;
    
    // filter on output's key image
    if (this.getKeyImage() !== undefined) {
      if (output.getKeyImage() === undefined) return false;
      if (this.getKeyImage().getHex() !== undefined && this.getKeyImage().getHex() !== output.getKeyImage().getHex()) return false;
      if (this.getKeyImage().getSignature() !== undefined && this.getKeyImage().getSignature() !== output.getKeyImage().getSignature()) return false;
    }
    
    // filter on extensions
    if (this.getSubaddressIndices() !== undefined && !this.getSubaddressIndices().includes(output.getSubaddressIndex())) return false;
    
    // filter with tx query
    if (this.getTxQuery() && !this.getTxQuery().meetsCriteria(output.getTx() as MoneroTxWallet, false)) return false;
    
    // filter on remaining fields
    if (this.getMinAmount() !== undefined && (output.getAmount() === undefined || output.getAmount() < this.getMinAmount())) return false;
    if (this.getMaxAmount() !== undefined && (output.getAmount() === undefined || output.getAmount() > this.getMaxAmount())) return false;
    
    // output meets query
    return true;
  }

  // -------------------- OVERRIDE COVARIANT RETURN TYPES ---------------------

  setTx(tx: MoneroTx): MoneroOutputQuery {
    super.setTx(tx);
    return this;
  }

  setAccountIndex(accountIndex: number): MoneroOutputQuery {
    super.setAccountIndex(accountIndex);
    return this;
  }

  setSubaddressIndex(subaddressIndex: number): MoneroOutputQuery {
    super.setSubaddressIndex(subaddressIndex);
    return this;
  }

  setIsSpent(isSpent: boolean): MoneroOutputQuery {
    super.setIsSpent(isSpent);
    return this;
  }
  
  setIsFrozen(isFrozen: boolean): MoneroOutputQuery {
    super.setIsFrozen(isFrozen);
    return this;
  }
  
  setKeyImage(keyImage: MoneroKeyImage): MoneroOutputQuery {
    super.setKeyImage(keyImage);
    return this;
  }

  setAmount(amount: bigint): MoneroOutputQuery {
    super.setAmount(amount);
    return this;
  }

  setIndex(index: number): MoneroOutputQuery {
    super.setIndex(index);
    return this;
  }

  setRingOutputIndices(ringOutputIndices: number[]): MoneroOutputQuery {
    super.setRingOutputIndices(ringOutputIndices);
    return this;
  }

  setStealthPublicKey(stealthPublicKey: string): MoneroOutputQuery {
    super.setStealthPublicKey(stealthPublicKey);
    return this;
  }
}
