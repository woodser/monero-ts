export = MoneroWalletKeys;
/**
 * Implements a MoneroWallet which only manages keys using WebAssembly.
 *
 * @implements {MoneroWallet}
 * @hideconstructor
 */
declare class MoneroWalletKeys extends MoneroWallet implements MoneroWallet {
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
     * @param {MoneroWalletConfig|object} config - MoneroWalletConfig or equivalent config object
     * @param {string|number} config.networkType - network type of the wallet to create (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
     * @param {string} config.seed - seed of the wallet to create (optional, random wallet created if neither seed nor keys given)
     * @param {string} config.seedOffset - the offset used to derive a new seed from the given seed to recover a secret wallet from the seed phrase
     * @param {string} config.primaryAddress - primary address of the wallet to create (only provide if restoring from keys)
     * @param {string} config.privateViewKey - private view key of the wallet to create (optional)
     * @param {string} config.privateSpendKey - private spend key of the wallet to create (optional)
     * @param {string} config.language - language of the wallet's seed (defaults to "English" or auto-detected)
     * @return {MoneroWalletKeys} the created wallet
     */
    static createWallet(config: MoneroWalletConfig | object): MoneroWalletKeys;
    static _createWalletRandom(config: any): Promise<any>;
    static _createWalletFromSeed(config: any): Promise<any>;
    static _createWalletFromKeys(config: any): Promise<any>;
    static getSeedLanguages(): Promise<any>;
    /**
     * Internal constructor which is given the memory address of a C++ wallet
     * instance.
     *
     * This method should not be called externally but should be called through
     * static wallet creation utilities in this class.
     *
     * @param {int} cppAddress - address of the wallet instance in C++
     */
    constructor(cppAddress: int);
    _cppAddress: int;
    _module: any;
    addListener(listener: any): Promise<void>;
    removeListener(listener: any): Promise<void>;
    isViewOnly(): Promise<any>;
    isConnectedToDaemon(): Promise<boolean>;
    getVersion(): Promise<any>;
    /**
     * @ignore
     */
    getPath(): void;
    getSeed(): Promise<any>;
    getSeedLanguage(): Promise<any>;
    getPrivateSpendKey(): Promise<any>;
    getPrivateViewKey(): Promise<any>;
    getPublicViewKey(): Promise<any>;
    getPublicSpendKey(): Promise<any>;
    getAddress(accountIdx: any, subaddressIdx: any): Promise<any>;
    getAddressIndex(address: any): Promise<any>;
    getAccounts(): void;
    close(save: any): Promise<any>;
    isClosed(): Promise<any>;
    getPrimaryAddress(...args: any[]): Promise<string>;
    getSubaddress(...args: any[]): Promise<MoneroSubaddress>;
    _assertNotClosed(): void;
}
import MoneroWallet = require("./MoneroWallet");
import MoneroWalletConfig = require("./model/MoneroWalletConfig");
