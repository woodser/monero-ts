export = MoneroTxConfig;
/**
 * Configures a transaction to send, sweep, or create a payment URI.
 */
declare class MoneroTxConfig {
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
     * &nbsp;&nbsp; priority: MoneroTxPriority.NORMAL,<br>
     * &nbsp;&nbsp; relay: true<br>
     * });<br><br>
     * </code>
     *
     * @param {MoneroTxConfig|object} config - configures the transaction to create (optional)
     * @param {string} config.address - single destination address
     * @param {BigInteger} config.amount - single destination amount
     * @param {int} config.accountIndex - source account index to transfer funds from
     * @param {int} config.subaddressIndex - source subaddress index to transfer funds from
     * @param {int[]} config.subaddressIndices - source subaddress indices to transfer funds from
     * @param {boolean} config.relay - relay the transaction to peers to commit to the blockchain
     * @param {MoneroTxPriority} config.priority - transaction priority (default MoneroTxPriority.NORMAL)
     * @param {MoneroDestination[]} config.destinations - addresses and amounts in a multi-destination tx
     * @param {int[]} config.subtractFeeFrom - list of destination indices to split the transaction fee
     * @param {string} config.paymentId - transaction payment ID
     * @param {BigInteger} config.unlockTime - minimum height or timestamp for the transaction to unlock (default 0)
     * @param {string} config.note - transaction note saved locally with the wallet
     * @param {string} config.recipientName - recipient name saved locally with the wallet
     * @param {boolean} config.canSplit - allow funds to be transferred using multiple transactions
     * @param {BigInteger} config.belowAmount - for sweep requests, include outputs below this amount when sweeping wallet, account, subaddress, or all unlocked funds
     * @param {boolean} config.sweepEachSubaddress - for sweep requests, sweep each subaddress individually instead of together if true
     * @param {string} config.keyImage - key image to sweep (ignored except in sweepOutput() requests)
     */
    constructor(config: MoneroTxConfig | object, relaxValidation: any, ...args: any[]);
    state: any;
    copy(): MoneroTxConfig;
    toJson(): any;
    /**
     * Set the address of a single-destination configuration.
     *
     * @param {string} address - the address to set for the single destination
     * @return {MoneroTxConfig} this configuration for chaining
     */
    setAddress(address: string): MoneroTxConfig;
    /**
     * Get the address of a single-destination configuration.
     *
     * @return {string} the address of the single destination
     */
    getAddress(): string;
    /**
     * Set the amount of a single-destination configuration.
     *
     * @param {BigInteger|string} amount - the amount to set for the single destination
     * @return {MoneroTxConfig} this configuration for chaining
     */
    setAmount(amount: BigInteger | string): MoneroTxConfig;
    /**
     * Get the amount of a single-destination configuration.
     *
     * @return {BigInteger} the amount of the single destination
     */
    getAmount(): BigInteger;
    addDestination(destinationOrAddress: any, amount: any): any;
    getDestinations(): any;
    setDestinations(destinations: any, ...args: any[]): this;
    setDestination(destination: any): this;
    getSubtractFeeFrom(): any;
    setSubtractFeeFrom(destinationIndices: any, ...args: any[]): this;
    getPaymentId(): any;
    setPaymentId(paymentId: any): this;
    getPriority(): any;
    setPriority(priority: any): this;
    getFee(): any;
    setFee(fee: any): this;
    getAccountIndex(): any;
    setAccountIndex(accountIndex: any): this;
    setSubaddressIndex(subaddressIndex: any): this;
    getSubaddressIndices(): any;
    setSubaddressIndices(subaddressIndices: any, ...args: any[]): this;
    getUnlockTime(): any;
    setUnlockTime(unlockTime: any): this;
    getRelay(): any;
    setRelay(relay: any): this;
    getCanSplit(): any;
    setCanSplit(canSplit: any): this;
    getNote(): any;
    setNote(note: any): this;
    getRecipientName(): any;
    setRecipientName(recipientName: any): this;
    getBelowAmount(): any;
    setBelowAmount(belowAmount: any): this;
    getSweepEachSubaddress(): any;
    setSweepEachSubaddress(sweepEachSubaddress: any): this;
    /**
     * Get the key image hex of the output to sweep.
     *
     * return {string} is the key image hex of the output to sweep
     */
    getKeyImage(): any;
    /**
     * Set the key image hex of the output to sweep.
     *
     * @param {string} keyImage is the key image hex of the output to sweep
     */
    setKeyImage(keyImage: string): this;
}
declare namespace MoneroTxConfig {
    let SUPPORTED_FIELDS: string[];
}
