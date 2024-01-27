import MoneroAccount from "./model/MoneroAccount";
import MoneroIntegratedAddress from "./model/MoneroIntegratedAddress";
import MoneroSubaddress from "./model/MoneroSubaddress";
import MoneroVersion from "../daemon/model/MoneroVersion";
import MoneroWallet from "./MoneroWallet";
import MoneroWalletConfig from "./model/MoneroWalletConfig";
/**
 * Implements a MoneroWallet which only manages keys using WebAssembly.
 */
export declare class MoneroWalletKeys extends MoneroWallet {
    protected cppAddress: string;
    protected module: any;
    protected walletProxy: MoneroWalletKeysProxy;
    /**
     * <p>Create a wallet using WebAssembly bindings to monero-project.</p>
     *
     * <p>Example:</p>
     *
     * <code>
     * let wallet = await MoneroWalletKeys.createWallet({<br>
     * &nbsp;&nbsp; password: "abc123",<br>
     * &nbsp;&nbsp; networkType: MoneroNetworkType.STAGENET,<br>
     * &nbsp;&nbsp; seed: "coexist igloo pamphlet lagoon..."<br>
     * });
     * </code>
     *
     * @param {MoneroWalletConfig} config - MoneroWalletConfig or equivalent config object
     * @param {string|number} config.networkType - network type of the wallet to create (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
     * @param {string} [config.seed] - seed of the wallet to create (optional, random wallet created if neither seed nor keys given)
     * @param {string} [config.seedOffset] - the offset used to derive a new seed from the given seed to recover a secret wallet from the seed phrase
     * @param {string} [config.primaryAddress] - primary address of the wallet to create (only provide if restoring from keys)
     * @param {string} [config.privateViewKey] - private view key of the wallet to create (optional)
     * @param {string} [config.privateSpendKey] - private spend key of the wallet to create (optional)
     * @param {string} [config.language] - language of the wallet's seed (defaults to "English" or auto-detected)
     * @return {MoneroWalletKeys} the created wallet
     */
    static createWallet(config: Partial<MoneroWalletConfig>): Promise<any>;
    protected static createWalletRandom(config: Partial<MoneroWalletConfig>): Promise<any>;
    protected static createWalletFromSeed(config: Partial<MoneroWalletConfig>): Promise<any>;
    protected static createWalletFromKeys(config: Partial<MoneroWalletConfig>): Promise<any>;
    static getSeedLanguages(): Promise<string[]>;
    /**
     * Internal constructor which is given the memory address of a C++ wallet
     * instance.
     *
     * This method should not be called externally but should be called through
     * static wallet creation utilities in this class.
     *
     * @param {number} cppAddress - address of the wallet instance in C++
     * @param {MoneroWalletKeysProxy} walletProxy - proxy
     *
     * @private
     */
    constructor(cppAddress: any, walletProxy?: MoneroWalletKeysProxy);
    isViewOnly(): Promise<boolean>;
    isConnectedToDaemon(): Promise<boolean>;
    getVersion(): Promise<MoneroVersion>;
    /**
     * @ignore
     */
    getPath(): Promise<string>;
    getSeed(): Promise<string>;
    getSeedLanguage(): Promise<string>;
    getPrivateSpendKey(): Promise<string>;
    getPrivateViewKey(): Promise<string>;
    getPublicViewKey(): Promise<string>;
    getPublicSpendKey(): Promise<string>;
    getAddress(accountIdx: number, subaddressIdx: number): Promise<string>;
    getAddressIndex(address: string): Promise<MoneroSubaddress>;
    getAccounts(includeSubaddresses?: boolean, tag?: string): Promise<MoneroAccount[]>;
    close(save?: boolean): Promise<void>;
    isClosed(): Promise<boolean>;
    getPrimaryAddress(): Promise<string>;
    getSubaddress(accountIdx: number, subaddressIdx: number): Promise<MoneroSubaddress>;
    static sanitizeSubaddress(subaddress: any): any;
    protected assertNotClosed(): void;
    protected getWalletProxy(): MoneroWalletKeysProxy;
}
/**
 * Implements a MoneroWallet by proxying requests to a worker which runs a keys-only wallet.
 *
 * TODO: sort these methods according to master sort in MoneroWallet.ts
 * TODO: probably only allow one listener to worker then propogate to registered listeners for performance
 *
 * @private
 */
export declare class MoneroWalletKeysProxy extends MoneroWallet {
    protected walletId: string;
    protected worker: Worker;
    static createWallet(config: any): Promise<MoneroWalletKeysProxy>;
    /**
     * Internal constructor which is given a worker to communicate with via messages.
     *
     * This method should not be called externally but should be called through
     * static wallet creation utilities in this class.
     *
     * @param {string} walletId - identifies the wallet with the worker
     * @param {Worker} worker - worker to communicate with via messages
     *
     * @protected
     */
    constructor(walletId: any, worker: any);
    isViewOnly(): Promise<boolean>;
    getVersion(): Promise<MoneroVersion>;
    getSeed(): Promise<string>;
    getSeedLanguage(): Promise<string>;
    getSeedLanguages(): Promise<any>;
    getPrivateSpendKey(): Promise<string>;
    getPrivateViewKey(): Promise<string>;
    getPublicViewKey(): Promise<string>;
    getPublicSpendKey(): Promise<string>;
    getAddress(accountIdx: any, subaddressIdx: any): Promise<string>;
    getAddressIndex(address: any): Promise<any>;
    getIntegratedAddress(standardAddress: any, paymentId: any): Promise<MoneroIntegratedAddress>;
    decodeIntegratedAddress(integratedAddress: any): Promise<MoneroIntegratedAddress>;
    close(save: any): Promise<void>;
    isClosed(): Promise<any>;
    protected invokeWorker(fnName: string, args?: any): Promise<any>;
}
