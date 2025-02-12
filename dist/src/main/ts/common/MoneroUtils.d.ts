import MoneroNetworkType from "../daemon/model/MoneroNetworkType";
/**
 * Collection of Monero utilities. Runs in a worker thread by default.
 */
export default class MoneroUtils {
    static PROXY_TO_WORKER: boolean;
    static NUM_MNEMONIC_WORDS: number;
    static AU_PER_XMR: bigint;
    static RING_SIZE: number;
    /**
     * <p>Get the version of the monero-ts library.<p>
     *
     * @return {string} the version of this monero-ts library
     */
    static getVersion(): string;
    /**
     * Enable or disable proxying these utilities to a worker thread.
     *
     * @param {boolean} proxyToWorker - specifies if utilities should be proxied to a worker
     */
    static setProxyToWorker(proxyToWorker: any): void;
    /**
     * Validate the given mnemonic, throw an error if invalid.
     *
     * TODO: improve validation, use network type
     *
     * @param {string} mnemonic - mnemonic to validate
     */
    static validateMnemonic(mnemonic: any): Promise<void>;
    /**
     * Indicates if a private view key is valid.
     *
     * @param {string} privateViewKey is the private view key to validate
     * @return {Promise<bool>} true if the private view key is valid, false otherwise
     */
    static isValidPrivateViewKey(privateViewKey: any): Promise<boolean>;
    /**
     * Indicates if a public view key is valid.
     *
     * @param {string} publicViewKey is the public view key to validate
     * @return {Promise<bool>} true if the public view key is valid, false otherwise
     */
    static isValidPublicViewKey(publicViewKey: any): Promise<boolean>;
    /**
     * Indicates if a private spend key is valid.
     *
     * @param {string} privateSpendKey is the private spend key to validate
     * @return {Promise<bool>} true if the private spend key is valid, false otherwise
     */
    static isValidPrivateSpendKey(privateSpendKey: any): Promise<boolean>;
    /**
     * Indicates if a public spend key is valid.
     *
     * @param {string} publicSpendKey is the public spend key to validate
     * @return {Promise<bool>} true if the public spend key is valid, false otherwise
     */
    static isValidPublicSpendKey(publicSpendKey: any): Promise<boolean>;
    /**
     * Validate the given private view key, throw an error if invalid.
     *
     * @param {string} privateViewKey - private view key to validate
     */
    static validatePrivateViewKey(privateViewKey: any): Promise<void>;
    /**
     * Validate the given public view key, throw an error if invalid.
     *
     * @param {string} publicViewKey - public view key to validate
     */
    static validatePublicViewKey(publicViewKey: any): Promise<void>;
    /**
     * Validate the given private spend key, throw an error if invalid.
     *
     * @param {string} privateSpendKey - private spend key to validate
     */
    static validatePrivateSpendKey(privateSpendKey: any): Promise<void>;
    /**
     * Validate the given public spend key, throw an error if invalid.
     *
     * @param {string} publicSpendKey - public spend key to validate
     */
    static validatePublicSpendKey(publicSpendKey: any): Promise<void>;
    /**
     * Get an integrated address.
     *
     * @param {MoneroNetworkType} networkType - network type of the integrated address
     * @param {string} standardAddress - address to derive the integrated address from
     * @param {string} [paymentId] - optionally specifies the integrated address's payment id (defaults to random payment id)
     * @return {Promise<MoneroIntegratedAddress>} the integrated address
     */
    static getIntegratedAddress(networkType: MoneroNetworkType, standardAddress: string, paymentId?: string): Promise<any>;
    /**
     * Determine if the given address is valid.
     *
     * @param {string} address - address
     * @param {MoneroNetworkType} networkType - network type of the address to validate
     * @return {Promise<boolean>} true if the address is valid, false otherwise
     */
    static isValidAddress(address: any, networkType: any): Promise<boolean>;
    /**
     * Validate the given address, throw an error if invalid.
     *
     * @param {string} address - address to validate
     * @param {MoneroNetworkType} networkType - network type of the address to validate
     */
    static validateAddress(address: any, networkType: any): Promise<any>;
    /**
     * Determine if the given payment id is valid.
     *
     * @param {string} paymentId - payment id to determine if valid
     * @return {Promise<bool>} true if the payment id is valid, false otherwise
     */
    static isValidPaymentId(paymentId: any): Promise<boolean>;
    /**
     * Validate the given payment id, throw an error if invalid.
     *
     * TODO: improve validation
     *
     * @param {string} paymentId - payment id to validate
     */
    static validatePaymentId(paymentId: any): Promise<void>;
    /**
     * Decode tx extra according to https://cryptonote.org/cns/cns005.txt and
     * returns the last tx pub key.
     *
     * TODO: use c++ bridge for this
     *
     * @param [byte[]] txExtra - array of tx extra bytes
     * @return {string} the last pub key as a hexidecimal string
     */
    static getLastTxPubKey(txExtra: any): Promise<string>;
    /**
     * Determines if two payment ids are functionally equal.
     *
     * For example, 03284e41c342f032 and 03284e41c342f032000000000000000000000000000000000000000000000000 are considered equal.
     *
     * @param {string} paymentId1 is a payment id to compare
     * @param {string} paymentId2 is a payment id to compare
     * @return {bool} true if the payment ids are equal, false otherwise
     */
    static paymentIdsEqual(paymentId1: any, paymentId2: any): boolean;
    /**
     * Merges a transaction into a list of existing transactions.
     *
     * @param {MoneroTx[]} txs - existing transactions to merge into
     * @param {MoneroTx} tx - transaction to merge into the list
     */
    static mergeTx(txs: any, tx: any): void;
    /**
     * Convert the given JSON to a binary Uint8Array using Monero's portable storage format.
     *
     * @param {object} json - json to convert to binary
     * @return {Promise<Uint8Array>} the json converted to portable storage binary
     */
    static jsonToBinary(json: any): Promise<any>;
    /**
     * Convert the given portable storage binary to JSON.
     *
     * @param {Uint8Array} uint8arr - binary data in Monero's portable storage format
     * @return {Promise<object>} JSON object converted from the binary data
     */
    static binaryToJson(uint8arr: any): Promise<any>;
    /**
     * Convert the binary response from daemon RPC block retrieval to JSON.
     *
     * @param {Uint8Array} uint8arr - binary response from daemon RPC when getting blocks
     * @return {Promise<object>} JSON object with the blocks data
     */
    static binaryBlocksToJson(uint8arr: any): Promise<any>;
    /**
     * Convert XMR to atomic units.
     *
     * @param {number | string} amountXmr - amount in XMR to convert to atomic units
     * @return {bigint} amount in atomic units
     */
    static xmrToAtomicUnits(amountXmr: number | string): bigint;
    /**
     * Convert atomic units to XMR.
     *
     * @param {bigint | string} amountAtomicUnits - amount in atomic units to convert to XMR
     * @return {number} amount in XMR
     */
    static atomicUnitsToXmr(amountAtomicUnits: bigint | string): number;
    /**
     * Divide one atomic units by another.
     *
     * @param {bigint} au1 dividend
     * @param {bigint} au2 divisor
     * @returns {number} the result
     */
    static divide(au1: bigint, au2: bigint): number;
    /**
     * Multiply a bigint by a number or bigint.
     *
     * @param a bigint to multiply
     * @param b bigint or number to multiply by
     * @returns the product as a bigint
     */
    static multiply(a: bigint, b: number | bigint): bigint;
    protected static isHex64(str: any): boolean;
    /**
     * Determine if the given unlock time is a timestamp or block height.
     *
     * @param unlockTime is the unlock time to check
     * @return {boolean} true if the unlock time is a timestamp, false if a block height
     */
    static isTimestamp(unlockTime: bigint): boolean;
}
