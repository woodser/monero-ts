import GenUtils from "../../common/GenUtils";
import MoneroDestination from "./MoneroDestination";
import MoneroIncomingTransfer from "./MoneroIncomingTransfer";
import MoneroOutgoingTransfer from "./MoneroOutgoingTransfer";
import MoneroTransfer from "./MoneroTransfer";
import MoneroTxWallet from "./MoneroTxWallet";
import MoneroTxQuery from "./MoneroTxQuery";
import MoneroError from "../../common/MoneroError";

/**
 * Configuration to query wallet transfers.
 */
export default class MoneroTransferQuery extends MoneroTransfer {

  txQuery: Partial<MoneroTxQuery>;
  isIncoming: boolean;
  address: string;
  addresses: string[];
  subaddressIndex: number;
  subaddressIndices: number[];
  destinations: MoneroDestination[];
  hasDestinations: boolean;
  
  /**
   * <p>Construct the transfer query.</p>
   * 
   * <p>Example:</p>
   * 
   * <code>
   * &sol;&sol; get incoming transfers to account 0, subaddress 1<br>
   * let transfers = await wallet.getTransfers({<br>
   * &nbsp;&nbsp; accountIndex: 0,<br>
   * &nbsp;&nbsp; subaddressIndex: 0<br>
   * });
   * </code>
   * 
   * <p>All configuration is optional.  All transfers are returned except those that don't meet criteria defined in this query.</p>
   * 
   * @param {Partial<MoneroTransferQuery>} [query] - transfer query configuration (optional)
   * @param {bigint} query.amount - get transfers with this amount
   * @param {number} query.accountIndex - get transfers to/from this account index
   * @param {number} query.subaddressIndex - get transfers to/from this subaddress index
   * @param {number[]} query.subaddressIndices - get transfers to/from these subaddress indices
   * @param {string} query.address - get transfers to/from this wallet address
   * @param {string[]} query.addresses - get transfers to/from these wallet addresses
   * @param {boolean} query.isIncoming - get transfers which are incoming if true
   * @param {boolean} query.isOutgoing - get transfers which are outgoing if true
   * @param {boolean} query.hasDestinations - get transfers with known destinations if true (destinations are only stored locally with the wallet)
   * @param {MoneroTxQuery} query.txQuery - get transfers whose tx match this tx query
   */
  constructor(query?: Partial<MoneroTransferQuery>) {
    super(query);
    if (this.txQuery && !(this.txQuery instanceof MoneroTxQuery)) this.txQuery = new MoneroTxQuery(this.txQuery);
    if (this.txQuery) this.txQuery.setTransferQuery(this);

    // alias isOutgoing to isIncoming
    if ((this as any).isOutgoing !== undefined) this.isIncoming = !(this as any).isOutgoing;
    this.validate();
  }
  
  copy(): MoneroTransferQuery {
    return new MoneroTransferQuery(this);
  }
  
  toJson(): any {
    let json = Object.assign({}, this, super.toJson());
    delete json.txQuery;
    return json;
  }
  
  getTxQuery(): MoneroTxQuery {
    return this.txQuery as MoneroTxQuery;
  }
  
  setTxQuery(txQuery: MoneroTxQuery): MoneroTransferQuery {
    this.txQuery = txQuery;
    if (txQuery) txQuery.setTransferQuery(this);
    return this;
  }
  
  getIsIncoming(): boolean {
    return this.isIncoming;
  }

  setIsIncoming(isIncoming: boolean): MoneroTransferQuery {
    this.isIncoming = isIncoming;
    return this;
  }
  
  getIsOutgoing(): boolean {
    return this.isIncoming === undefined ? undefined : !this.isIncoming;
  }
  
  setIsOutgoing(isOutgoing: boolean): MoneroTransferQuery {
    this.isIncoming = isOutgoing === undefined ? undefined : !isOutgoing;
    return this;
  }
  
  getAddress(): string {
    return this.address;
  }

  setAddress(address: string): MoneroTransferQuery {
    this.address = address;
    return this;
  }
  
  getAddresses(): string[] {
    return this.addresses;
  }

  setAddresses(addresses: string[]): MoneroTransferQuery {
    this.addresses = addresses;
    return this;
  }
  
  getSubaddressIndex(): number {
    return this.subaddressIndex;
  }
  
  setSubaddressIndex(subaddressIndex: number): MoneroTransferQuery {
    this.subaddressIndex = subaddressIndex;
    this.validate();
    return this;
  }
  
  getSubaddressIndices(): number[] {
    return this.subaddressIndices;
  }
  
  setSubaddressIndices(subaddressIndices: number[]): MoneroTransferQuery {
    this.subaddressIndices = subaddressIndices;
    this.validate();
    return this;
  }
  
  getDestinations(): MoneroDestination[] {
    return this.destinations;
  }
  
  setDestinations(destinations: MoneroDestination[]) {
    this.destinations = destinations;
    return this;
  }
  
  getHasDestinations(): boolean {
    return this.hasDestinations;
  }
  
  setHasDestinations(hasDestinations: boolean): MoneroTransferQuery {
    this.hasDestinations = hasDestinations;
    return this;
  }
  
  /**
   * Convenience method to query outputs by the locked state of their tx.
   * 
   * @param isLocked specifies if the output's tx must be locked or unlocked (optional)
   * @return {MoneroOutputQuery} this query for chaining
   */
  setIsLocked(isLocked: boolean): MoneroTransferQuery {
    if (this.txQuery === undefined) this.txQuery = new MoneroTxQuery();
    this.getTxQuery().setIsLocked(isLocked);
    return this;
  }
  
  meetsCriteria(transfer: MoneroTransfer, queryParent = true): boolean {
    if (!(transfer instanceof MoneroTransfer)) throw new Error("Transfer not given to MoneroTransferQuery.meetsCriteria(transfer)");
    
    // filter on common fields
    if (this.getIsIncoming() !== undefined && this.getIsIncoming() !== transfer.getIsIncoming()) return false;
    if (this.getIsOutgoing() !== undefined && this.getIsOutgoing() !== transfer.getIsOutgoing()) return false;
    if (this.getAmount() !== undefined && this.getAmount() !== transfer.getAmount()) return false;
    if (this.getAccountIndex() !== undefined && this.getAccountIndex() !== transfer.getAccountIndex()) return false;
    
    // filter on incoming fields
    if (transfer instanceof MoneroIncomingTransfer) {
      if (this.getHasDestinations() !== undefined) return false;
      if (this.getAddress() !== undefined && this.getAddress() !== transfer.getAddress()) return false;
      if (this.getAddresses() !== undefined && !this.getAddresses().includes(transfer.getAddress())) return false;
      if (this.getSubaddressIndex() !== undefined && this.getSubaddressIndex() !== transfer.getSubaddressIndex()) return false;
      if (this.getSubaddressIndices() !== undefined && !this.getSubaddressIndices().includes(transfer.getSubaddressIndex())) return false;
    }

    // filter on outgoing fields
    else if (transfer instanceof MoneroOutgoingTransfer) {
      
      // filter on addresses which must have overlap
      if (this.getAddress() !== undefined && (transfer.getAddresses() === undefined || !transfer.getAddresses().includes(this.getAddress()))) return false;   // TODO: will filter all transfers that don't contain addresses (outgoing txs might not have this field initialized)
      if (this.getAddresses() !== undefined) {
        if (!transfer.getAddresses()) return false;
        if (!this.getAddresses().some(address => transfer.getAddresses().includes(address))) return false;
      }
      
      // filter on subaddress indices
      if (this.getSubaddressIndex() !== undefined && (transfer.getSubaddressIndices() === undefined || !transfer.getSubaddressIndices().includes(this.getSubaddressIndex()))) return false;
      if (this.getSubaddressIndices() !== undefined) {
        if (!transfer.getSubaddressIndices()) return false;
        if (!this.getSubaddressIndices().some(subaddressIdx => transfer.getSubaddressIndices().includes(subaddressIdx))) return false;
      }
      
      // filter on having destinations
      if (this.getHasDestinations() !== undefined) {
        if (this.getHasDestinations() && transfer.getDestinations() === undefined) return false;
        if (!this.getHasDestinations() && transfer.getDestinations() !== undefined) return false;
      }
      
      // filter on destinations TODO: start with test for this
//    if (this.getDestionations() !== undefined && this.getDestionations() !== transfer.getDestionations()) return false;
    }
    
    // otherwise invalid type
    else throw new Error("Transfer must be MoneroIncomingTransfer or MoneroOutgoingTransfer");
    
    // filter with tx filter
    if (queryParent && this.getTxQuery() !== undefined && !this.getTxQuery().meetsCriteria(transfer.getTx())) return false;    
    return true;
  }
  
  validate() {
    if (this.getSubaddressIndex() !== undefined && this.getSubaddressIndex() < 0) throw new MoneroError("Subaddress index must be >= 0");
    if (this.getSubaddressIndices() !== undefined) for (let subaddressIdx of this.getSubaddressIndices()) if (subaddressIdx < 0) throw new MoneroError("Subaddress indices must be >= 0");
  }

    // -------------------- OVERRIDE COVARIANT RETURN TYPES ---------------------

    setTx(tx: MoneroTxWallet): MoneroTransferQuery {
      super.setTx(tx);
      return this;
    }
  
    setAmount(amount: bigint): MoneroTransferQuery {
      super.setAmount(amount);
      return this;
    }
  
    setAccountIndex(accountIndex: number): MoneroTransferQuery {
      super.setAccountIndex(accountIndex);
      return this;
    }
}
