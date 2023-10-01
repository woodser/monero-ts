/**
 * Defines the Monero network types (mainnet, testnet, and stagenet).
 */
export default class MoneroNetworkType {
    /**
     * Mainnet (value=0).
     */
    static readonly MAINNET = 0;
    /**
     * Testnet (value=1).
     */
    static readonly TESTNET = 1;
    /**
     * Stagnet (value=2).
     */
    static readonly STAGENET = 2;
    /**
     * Validate and normalize the given network type.
     *
     * @param {MoneroNetworkType | number | string} networkType - the network type to validate and normalize
     * @return {MoneroNetworkType} the given network type
     */
    static from(networkType: MoneroNetworkType | number | string): MoneroNetworkType;
    /**
     * Validate the given network type.
     *
     * @param {MoneroNetworkType} networkType - the network type to validate as a numeric
     */
    static validate(networkType: MoneroNetworkType | number | string): void;
    /**
     * Indicates if the given network type is valid or not.
     *
     * @param {MoneroNetworkType | number} networkType - the network type to validate as a numeric
     * @return {boolean} true if the network type is valid, false otherwise
     */
    static isValid(networkType: MoneroNetworkType | number | string): boolean;
    /**
     * Parse the given string as a network type.
     *
     * @param {string} networkTypeStr - "mainnet", "testnet", or "stagenet" (case insensitive)
     * @return {MoneroNetworkType} the network type as a numeric
     */
    static parse(networkTypeStr: string): MoneroNetworkType;
    /**
     * Get the network type in human-readable form.
     *
     * @return {string} the network type in human-readable form
     */
    static toString(networkType: MoneroNetworkType | number): string;
}
