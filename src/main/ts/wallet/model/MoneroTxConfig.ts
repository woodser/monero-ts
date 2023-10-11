import assert from "assert";
import MoneroDestination from "./MoneroDestination";
import MoneroError from "../../common/MoneroError";
import MoneroTxPriority from "./MoneroTxPriority";

/**
 * Configures a transaction to send, sweep, or create a payment URI.
 */
export default class MoneroTxConfig {

  /** Single destination address (required unless `destinations` provided). */
  address: string;

  /** Single destination amount (required unless `destinations provided). */
  amount: bigint;

  /** Source account index to transfer funds from (required unless sweeping key image). */
  accountIndex: number;

  /** Source subaddress index to send funds from (default all). */
  subaddressIndex: number;

  /** Source subaddresses to send funds from (default all). */
  subaddressIndices: number[];

  /** Relay the transaction to peers to commit to the blockchain if true (default false). */
  relay: boolean;

  /** Transaction priority to adjust the miner fee (default MoneroTxPriority.NORMAL). */
  priority: MoneroTxPriority;

  /** Multiple destinations to send funds to, if applicable. */
  destinations: Partial<MoneroDestination>[];

  /** List of destination indices to split the miner fee (optional). */
  subtractFeeFrom: number[];

  /** Payment ID for the transaction. */
  paymentId: string;

  /** Minimum height or timestamp for the transaction to unlock (default 0). */
  unlockTime: bigint;

  /** Miner fee (calculated automatically). */
  fee: bigint;

  /** Transaction note saved locally with the wallet (optional). */
  note: string;

  /** Recipient name saved locally with the wallet (optional). */
  recipientName: string;

  /** Allow funds to be transferred using multiple transactions if necessary (default false). */
  canSplit: boolean;

  /** For sweep requests, include outputs below this amount when sweeping wallet, account, subaddress, or all unlocked funds. */
  belowAmount: bigint;

  /** For sweep requests, sweep each subaddress individually instead of together if true. */
  sweepEachSubaddress: boolean;

  /** For sweep requests, key image of the output to sweep. */
  keyImage: string;
  
  /**
   * <p>Generic request to transfer funds from a wallet.</p>
   * 
   * <p>Example:</p>
   * 
   * <code>
   * let config1 = new MoneroTxConfig({<br>
   * &nbsp;&nbsp; accountIndex: 0,<br>
   * &nbsp;&nbsp; address: "59aZULsUF3YN...",<br>
   * &nbsp;&nbsp; amount: BigInt("500000"),<br>
   * &nbsp;&nbsp; priority: MoneroTxPriority.NORMAL,<br>
   * &nbsp;&nbsp; relay: true<br>
   * });
   * </code>
   * 
   * @param {Partial<MoneroTxConfig>} [config] - configures the transaction to create (optional)
   * @param {string} [config.address] - single destination address
   * @param {bigint} [config.amount] - single destination amount
   * @param {number} [config.accountIndex] - source account index to transfer funds from
   * @param {number} [config.subaddressIndex] - source subaddress index to transfer funds from
   * @param {number[]} [config.subaddressIndices] - source subaddress indices to transfer funds from
   * @param {boolean} [config.relay] - relay the transaction to peers to commit to the blockchain
   * @param {MoneroTxPriority} [config.priority] - transaction priority (default MoneroTxPriority.NORMAL)
   * @param {MoneroDestination[]} [config.destinations] - addresses and amounts in a multi-destination tx
   * @param {number[]} [config.subtractFeeFrom] - list of destination indices to split the transaction fee
   * @param {string} [config.paymentId] - transaction payment ID
   * @param {bigint} [config.unlockTime] - minimum height or timestamp for the transaction to unlock (default 0)
   * @param {string} [config.note] - transaction note saved locally with the wallet
   * @param {string} [config.recipientName] - recipient name saved locally with the wallet
   * @param {boolean} [config.canSplit] - allow funds to be transferred using multiple transactions
   * @param {bigint} [config.belowAmount] - for sweep requests, include outputs below this amount when sweeping wallet, account, subaddress, or all unlocked funds 
   * @param {boolean} [config.sweepEachSubaddress] - for sweep requests, sweep each subaddress individually instead of together if true
   * @param {string} [config.keyImage] - key image to sweep (ignored except in sweepOutput() requests)
   */
  constructor(config?: Partial<MoneroTxConfig>) {
    Object.assign(this, config);

    // deserialize bigints
    if (this.amount !== undefined && typeof this.amount !== "bigint") this.amount = BigInt(this.amount);
    if (this.fee !== undefined && typeof this.fee !== "bigint") this.fee = BigInt(this.fee);
    if (this.unlockTime !== undefined && typeof this.unlockTime !== "bigint") this.unlockTime = BigInt(this.unlockTime);
    if (this.belowAmount !== undefined && typeof this.belowAmount !== "bigint") this.belowAmount = BigInt(this.belowAmount);

    // copy destinations
    if (this.destinations) {
      assert(this.address === undefined && this.amount === undefined, "Tx configuration may specify destinations or an address/amount but not both");
      this.setDestinations(this.destinations.map(destination => new MoneroDestination(destination)));
    }
    
    // alias 'address' and 'amount' to single destination to support e.g. createTx({address: "..."})
    if (this.address || this.amount) {
      assert(!this.destinations, "Tx configuration may specify destinations or an address/amount but not both");
      this.setAddress(this.address);
      this.setAmount(this.amount);
      delete this.address;
      delete this.amount;
    }
    
    // alias 'subaddressIndex' to subaddress indices
    if (this.subaddressIndex !== undefined) {
      this.setSubaddressIndices([this.subaddressIndex]);
      delete this.subaddressIndex;
    }
  }
  
  copy(): MoneroTxConfig {
    return new MoneroTxConfig(this);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this); // copy state
    if (this.getDestinations() !== undefined) {
      json.destinations = [];
      for (let destination of this.getDestinations()) json.destinations.push(destination.toJson());
    }
    if (this.getFee()) json.fee = this.getFee().toString();
    if (this.getUnlockTime()) json.unlockTime = this.getUnlockTime().toString();
    if (this.getBelowAmount()) json.belowAmount = this.getBelowAmount().toString();
    return json;
  }
  
  /**
   * Set the address of a single-destination configuration.
   * 
   * @param {string} address - the address to set for the single destination
   * @return {MoneroTxConfig} this configuration for chaining
   */
  setAddress(address: string): MoneroTxConfig {
    if (this.destinations !== undefined && this.destinations.length > 1) throw new MoneroError("Cannot set address because MoneroTxConfig already has multiple destinations");
    if (this.destinations === undefined || this.destinations.length === 0) this.addDestination(new MoneroDestination(address));
    else (this.destinations[0] as MoneroDestination).setAddress(address);
    return this;
  }
  
  /**
   * Get the address of a single-destination configuration.
   * 
   * @return {string} the address of the single destination
   */
  getAddress(): string {
    if (this.destinations === undefined || this.destinations.length !== 1) throw new MoneroError("Cannot get address because MoneroTxConfig does not have exactly one destination");
    return (this.destinations[0] as MoneroDestination).getAddress();
  }
  
  /**
   * Set the amount of a single-destination configuration.
   * 
   * @param {bigint} amount - the amount to set for the single destination
   * @return {MoneroTxConfig} this configuration for chaining
   */
  setAmount(amount: bigint): MoneroTxConfig {
    if (amount !== undefined && typeof this.amount !== "bigint") {
      if (typeof amount === "number") throw new MoneroError("Destination amount must be bigint or string");
      try { amount = BigInt(amount); }
      catch (err) { throw new MoneroError("Invalid destination amount: " + amount); }
    }
    if (this.destinations !== undefined && this.destinations.length > 1) throw new MoneroError("Cannot set amount because MoneroTxConfig already has multiple destinations");
    if (this.destinations === undefined || this.destinations.length === 0) this.addDestination(new MoneroDestination(undefined, amount));
    else (this.destinations[0] as MoneroDestination).setAmount(amount);
    return this;
  }
  
  /**
   * Get the amount of a single-destination configuration.
   * 
   * @return {bigint} the amount of the single destination
   */
  getAmount(): bigint {
    if (this.destinations === undefined || this.destinations.length !== 1) throw new MoneroError("Cannot get amount because MoneroTxConfig does not have exactly one destination");
    return (this.destinations[0] as MoneroDestination).getAmount();
  }
  
  addDestination(destinationOrAddress: MoneroDestination | string, amount?: bigint): MoneroTxConfig {
    if (typeof destinationOrAddress === "string") return this.addDestination(new MoneroDestination(destinationOrAddress, amount));
    assert(destinationOrAddress instanceof MoneroDestination);
    if (this.destinations === undefined) this.destinations = [];
    this.destinations.push(destinationOrAddress);
    return this;
  }
  
  getDestinations(): MoneroDestination[] {
    return this.destinations as MoneroDestination[];
  }
  
  setDestinations(destinations: MoneroDestination[]): MoneroTxConfig {
    if (arguments.length > 1) destinations = Array.from(arguments);
    this.destinations = destinations;
    return this;
  }
  
  setDestination(destination: MoneroDestination): MoneroTxConfig {
    return this.setDestinations(destination ? [destination] : undefined);
  }

  getSubtractFeeFrom(): number[] {
    return this.subtractFeeFrom;
  }

  setSubtractFeeFrom(destinationIndices: number[]): MoneroTxConfig {
    if (arguments.length > 1) destinationIndices = Array.from(arguments);
    this.subtractFeeFrom = destinationIndices;
    return this;
  }
  
  getPaymentId(): string {
    return this.paymentId;
  }
  
  setPaymentId(paymentId: string): MoneroTxConfig {
    this.paymentId = paymentId;
    return this;
  }
  
  getPriority(): number {
    return this.priority;
  }
  
  setPriority(priority: number): MoneroTxConfig {
    this.priority = priority;
    return this;
  }
  
  getFee(): bigint {
    return this.fee;
  }
  
  setFee(fee: bigint): MoneroTxConfig {
    this.fee = fee;
    return this;
  }
  
  getAccountIndex(): number {
    return this.accountIndex;
  }
  
  setAccountIndex(accountIndex: number): MoneroTxConfig {
    this.accountIndex = accountIndex;
    return this;
  }
  
  setSubaddressIndex(subaddressIndex: number): MoneroTxConfig {
    this.setSubaddressIndices([subaddressIndex]);
    return this;
  }
  
  getSubaddressIndices(): number[] {
    return this.subaddressIndices;
  }
  
  setSubaddressIndices(subaddressIndices: number[]): MoneroTxConfig {
    if (arguments.length > 1) subaddressIndices = Array.from(arguments);
    this.subaddressIndices = subaddressIndices;
    return this;
  }
  
  getUnlockTime(): bigint {
    return this.unlockTime;
  }
  
  setUnlockTime(unlockTime: bigint): MoneroTxConfig {
    this.unlockTime = unlockTime;
    return this;
  }
  
  getRelay(): boolean {
    return this.relay;
  }
  
  setRelay(relay: boolean): MoneroTxConfig {
    this.relay = relay;
    return this;
  }
  
  getCanSplit(): boolean {
    return this.canSplit;
  }
  
  setCanSplit(canSplit: boolean): MoneroTxConfig {
    this.canSplit = canSplit;
    return this;
  }
  
  getNote(): string {
    return this.note;
  }
  
  setNote(note: string): MoneroTxConfig {
    this.note = note;
    return this;
  }
  
  getRecipientName(): string {
    return this.recipientName;
  }
  
  setRecipientName(recipientName: string): MoneroTxConfig {
    this.recipientName = recipientName;
    return this;
  }
  
  // --------------------------- SPECIFIC TO SWEEP ----------------------------
  
  getBelowAmount() {
    return this.belowAmount;
  }
  
  setBelowAmount(belowAmount) {
    this.belowAmount = belowAmount;
    return this;
  }
  
  getSweepEachSubaddress() {
    return this.sweepEachSubaddress;
  }
  
  setSweepEachSubaddress(sweepEachSubaddress) {
    this.sweepEachSubaddress = sweepEachSubaddress;
    return this;
  }
  
  /**
   * Get the key image hex of the output to sweep.
   * 
   * return {string} is the key image hex of the output to sweep
   */
  getKeyImage() {
    return this.keyImage;
  }
  
  /**
   * Set the key image hex of the output to sweep.
   * 
   * @param {string} keyImage is the key image hex of the output to sweep
   */
  setKeyImage(keyImage) {
    this.keyImage = keyImage;
    return this;
  }
}
