/**
 * Configures a transaction to send, sweep, or create a payment URI.
 */
class MoneroTxConfig {
  
  /**
   * <p>Generic request to transfer funds from a wallet.</p>
   * 
   * <p>Examples:</p>
   * 
   * <code>
   * let config1 = new MoneroTxConfig({<br>
   * &nbsp;&nbsp; accountIndex: 0,<br>
   * &nbsp;&nbsp; address: "59aZULsUF3YN...",<br>
   * &nbsp;&nbsp; amount: new BigInteger("500000"),<br>
   * &nbsp;&nbsp; priority: MoneroTxPriority.NORMAL<br>
   * });<br><br>
   * 
   * let config2 = new MoneroTxConfig(0, "59aZULsUF3YN...", new BigInteger("500000"), MoneroTxPriority.NORMAL);
   * config2.setDoNotRelay(true);  // do not relay transaction to the network
   * </code>
   * 
   * @param {object|number|string} param1 - tx configuration, source account index, or destination address
   * @param {int} param1.accountIndex - source account index to transfer funds from
   * @param {string} param1.address - single destination address (required unless destinations config given separately)
   * @param {BigInteger} param1.amount - single destination amount (required unless destination config given separately or sweep request)
   * @param {int} param1.priority - transaction priority (optional, default MoneroTxPriority.NORMAL)
   * @param {int[]} param1.subaddressIndices - source subaddress indices to transfer funds from (optional)
   * @param {MoneroDestination[]} param1.destinations - transfer destinations with addresses and amounts (required unless address/amount given separately)
   * @param {string} param1.paymentId - transaction payment ID (optional)
   * @param {BigInteger} param1.fee - transaction fee (optional, note: currently ignored)
   * @param {boolean} param1.doNotRelay - do not relay the transaction to the network if true
   * @param {int} param1.unlockTime - number of confirmations before the recipient can spend the funds
   * @param {boolean} param1.canSplit - allow funds to be transferred using multiple transactions (optional)
   * @param {string} param1.note - note for the transaction saved in the wallet (optional)
   * @param {string} param1.recipientName - recipient name for the transaction saved in the wallet (optional)
   * @param {BigInteger} param1.belowAmount - for sweep requests, include outputs below this amount when sweeping wallet, account, subaddress, or all unlocked funds (optional) 
   * @param {boolean} param1.sweepEachSubaddress - for sweep requests, sweep each subaddress individually instead of together if true (optional)
   * @param {string} param1.keyImage - key image to sweep (ignored except in sweepOutput() requests)
   * @param {string|BigInteger} param2 - destination address or send amount
   * @param {BigInteger|number} param3 - send amount or transaction priority
   * @param {number} param4 - transaction priority
   */
  constructor(param1, param2, param3, param4) {
    
    // handle if first parameter is json
    if (typeof param1 === "object") {
      this.state = Object.assign({}, param1);
      assert.equal(arguments.length, 1, "Tx configuration must be constructed with json or parameters but not both");
      
      // deserialize if necessary
      if (this.state.destinations) {
        assert(this.state.address === undefined && this.state.amount === undefined, "Tx configuration may specify destinations or an address/amount but not both");
        this.setDestinations(this.state.destinations.map(destination => destination instanceof MoneroDestination ? destination : new MoneroDestination(destination)));
      }
      
      // alias 'address' and 'amount' to single destination to support e.g. sendTx({address: "..."})
      if (this.state.address || this.state.amount) {
        assert(!this.state.destinations, "Tx configuration may specify destinations or an address/amount but not both");
        this.setDestinations([new MoneroDestination(this.state.address, this.state.amount)]);
        delete this.state.address;
        delete this.state.amount;
      }
      
      // alias 'subaddressIndex' to subaddress indices
      if (this.state.subaddressIndex !== undefined) {
        this.setSubaddressIndices([this.state.subaddressIndex]);
        delete this.state.subaddressIndex;
      }
    }
    
    // otherwise map parameters to request values
    else {
      assert(arguments.length <= 4, "MoneroTxConfig constructor accepts at most 4 parameters");
      this.state = {};
      if (param1 === undefined || typeof param1 === "number") {
        assert(param2 === undefined || typeof param2 === "string", "Second parameter must be the address or undefined");
        assert(param3 === undefined || param3 instanceof BigInteger, "Third parameter must be the amount or undefined");
        assert(param4 === undefined || typeof param4 === "number", "Fourth parameter must the priority or undefined");
        this.setAccountIndex(param1);
        if (param2 !== undefined) this.setDestinations([new MoneroDestination(param2, param3)])
        this.setPriority(param4);
      } else if (typeof param1 === "string") {
        assert(param2 === undefined || param2 instanceof BigInteger, "Second parameter must be the amount or undefined");
        assert(param3 === undefined || typeof param3 === "number", "Third parameter must be the priority or undefined");
        assert(param4 === undefined, "Fourth parameter must be undefined because first parameter is address");
        this.setDestinations([new MoneroDestination(param1, param2)])
        this.setPriority(param3);
      } else {
        throw new MoneroError("First parameter of MoneroTxConfig constructor must be an object, number, string, or undefined: " + param1);
      }
    }
  }
  
  copy() {
    return new MoneroTxConfig(this.state);
  }
  
  toJson() {
    let json = Object.assign({}, this.state); // copy state
    if (this.getDestinations()) {
      json.destinations = [];
      for (let destination of this.getDestinations()) json.destinations.push(destination.toJson());
    }
    if (this.getFee()) json.fee = this.getFee().toString();
    if (this.getBelowAmount()) json.belowAmount = this.getBelowAmount().toString();
    return json;
  }
  
  /**
   * Set the address of a single-destination configuration.
   * 
   * @param {string} address - the address to set for the single destination
   * @return {MoneroTxConfig} this configuration for chaining
   */
  setAddress(address) {
    if (this.destinations !== undefined && this.destinations.length > 1) throw new MoneroError("Cannot set address because MoneroTxConfig already has multiple destinations");
    if (this.destinations === undefined || this.destinations.length === 0) this.addDestination(new MoneroDestination(address));
    else this.destinations[0].setAddress(address);
    return this;
  }
  
  /**
   * Get the address of a single-destination configuration.
   * 
   * @return {string} the address of the single destination
   */
  getAddress() {
    if (this.destinations === undefined || this.destinations.length !== 1) throw new MoneroError("Cannot get address because MoneroTxConfig does not have exactly one destination");
    return this.destinations[0].getAddress();
  }
  
  /**
   * Set the amount of a single-destination configuration.
   * 
   * @param {BigInteger} amount - the amount to set for the single destination
   * @return {MoneroTxConfig} this configuration for chaining
   */
  setAmount(amount) {
    if (this.destinations !== undefined && this.destinations.length > 1) throw new MoneroError("Cannot set amount because MoneroTxConfig already has multiple destinations");
    if (this.destinations === undefined || this.destinations.length === 0) this.addDestination(new MoneroDestination(undefined, amount));
    else this.destinations[0].setAmount(amount);
    return this;
  }
  
  /**
   * Get the amount of a single-destination configuration.
   * 
   * @return {BigInteger} the amount of the single destination
   */
  getAmount() {
    if (this.destinations === undefined || this.destinations.length !== 1) throw new MoneroError("Cannot get amount because MoneroTxConfig does not have exactly one destination");
    return this.destinations[0].getAmount();
  }
  
  addDestination(destination) {
    assert(destination instanceof MoneroDestination);
    if (this.state.destinations === undefined) this.state.destinations = [];
    this.state.destinations.push(destination);
    return this;
  }
  
  getDestinations() {
    return this.state.destinations;
  }
  
  setDestinations(destinations) {
    if (arguments.length > 1) destinations = Array.from(arguments);
    this.state.destinations = destinations;
    return this;
  }
  
  setDestination(destination) {
    return this.setDestinations(destination ? [destination] : destination);
  }
  
  getPaymentId() {
    return this.state.paymentId;
  }
  
  setPaymentId(paymentId) {
    this.state.paymentId = paymentId;
    return this;
  }
  
  getPriority() {
    return this.state.priority;
  }
  
  setPriority(priority) {
    this.state.priority = priority;
    return this;
  }
  
  getFee() {
    return this.state.fee;
  }
  
  setFee(fee) {
    this.state.fee = fee;
    return this;
  }
  
  getAccountIndex() {
    return this.state.accountIndex;
  }
  
  setAccountIndex(accountIndex) {
    this.state.accountIndex = accountIndex;
    return this;
  }
  
  setSubaddressIndex(subaddressIndex) {
    this.setSubaddressIndices([subaddressIndex]);
    return this;
  }
  
  getSubaddressIndices() {
    return this.state.subaddressIndices;
  }
  
  setSubaddressIndices(subaddressIndices) {
    if (arguments.length > 1) subaddressIndices = Array.from(arguments);
    this.state.subaddressIndices = subaddressIndices;
    return this;
  }
  
  getUnlockTime() {
    return this.state.unlockTime;
  }
  
  setUnlockTime(unlockTime) {
    this.state.unlockTime = unlockTime;
    return this;
  }
  
  getDoNotRelay() {
    return this.state.doNotRelay;
  }
  
  setDoNotRelay(doNotRelay) {
    this.state.doNotRelay = doNotRelay;
    return this;
  }
  
  getCanSplit() {
    return this.state.canSplit;
  }
  
  setCanSplit(canSplit) {
    this.state.canSplit = canSplit;
    return this;
  }
  
  getNote() {
    return this.state.note;
  }
  
  setNote(note) {
    this.state.note = note;
    return this;
  }
  
  getRecipientName() {
    return this.state.recipientName;
  }
  
  setRecipientName(recipientName) {
    this.state.recipientName = recipientName;
    return this;
  }
  
  // --------------------------- SPECIFIC TO SWEEP ----------------------------
  
  getBelowAmount() {
    return this.state.belowAmount;
  }
  
  setBelowAmount(belowAmount) {
    this.state.belowAmount = belowAmount;
    return this;
  }
  
  getSweepEachSubaddress() {
    return this.state.sweepEachSubaddress;
  }
  
  setSweepEachSubaddress(sweepEachSubaddress) {
    this.state.sweepEachSubaddress = sweepEachSubaddress;
    return this;
  }
  
  /**
   * Get the key image hex of the output to sweep.
   * 
   * return {string} is the key image hex of the output to sweep
   */
  getKeyImage() {
    return this.state.keyImage;
  }
  
  /**
   * Set the key image hex of the output to sweep.
   * 
   * @param {string} keyImage is the key image hex of the output to sweep
   */
  setKeyImage(keyImage) {
    this.state.keyImage = keyImage;
    return this;
  }
}

module.exports = MoneroTxConfig