import MoneroDestination from "./MoneroDestination";
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
     * &nbsp;&nbsp; amount: 500000n,<br>
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
    constructor(config?: Partial<MoneroTxConfig>);
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
     * @param {bigint} amount - the amount to set for the single destination
     * @return {MoneroTxConfig} this configuration for chaining
     */
    setAmount(amount: bigint): MoneroTxConfig;
    /**
     * Get the amount of a single-destination configuration.
     *
     * @return {bigint} the amount of the single destination
     */
    getAmount(): bigint;
    addDestination(destinationOrAddress: MoneroDestination | string, amount?: bigint): MoneroTxConfig;
    getDestinations(): MoneroDestination[];
    setDestinations(destinations: MoneroDestination[]): MoneroTxConfig;
    setDestination(destination: MoneroDestination): MoneroTxConfig;
    getSubtractFeeFrom(): number[];
    setSubtractFeeFrom(destinationIndices: number[]): MoneroTxConfig;
    getPaymentId(): string;
    setPaymentId(paymentId: string): MoneroTxConfig;
    getPriority(): number;
    setPriority(priority: number): MoneroTxConfig;
    getFee(): bigint;
    setFee(fee: bigint): MoneroTxConfig;
    getAccountIndex(): number;
    setAccountIndex(accountIndex: number): MoneroTxConfig;
    setSubaddressIndex(subaddressIndex: number): MoneroTxConfig;
    getSubaddressIndices(): number[];
    setSubaddressIndices(subaddressIndices: number[]): MoneroTxConfig;
    getRelay(): boolean;
    setRelay(relay: boolean): MoneroTxConfig;
    getCanSplit(): boolean;
    setCanSplit(canSplit: boolean): MoneroTxConfig;
    getNote(): string;
    setNote(note: string): MoneroTxConfig;
    getRecipientName(): string;
    setRecipientName(recipientName: string): MoneroTxConfig;
    getBelowAmount(): bigint;
    setBelowAmount(belowAmount: any): this;
    getSweepEachSubaddress(): boolean;
    setSweepEachSubaddress(sweepEachSubaddress: any): this;
    /**
     * Get the key image hex of the output to sweep.
     *
     * return {string} is the key image hex of the output to sweep
     */
    getKeyImage(): string;
    /**
     * Set the key image hex of the output to sweep.
     *
     * @param {string} keyImage is the key image hex of the output to sweep
     */
    setKeyImage(keyImage: any): this;
}
