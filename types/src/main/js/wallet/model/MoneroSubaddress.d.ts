export = MoneroSubaddress;
/**
 * Monero subaddress model.
 */
declare class MoneroSubaddress {
    constructor(stateOrAddress: any, accountIndex: any, index: any);
    state: any;
    toJson(): any;
    getAccountIndex(): any;
    setAccountIndex(accountIndex: any): this;
    getIndex(): any;
    setIndex(index: any): this;
    getAddress(): any;
    setAddress(address: any): this;
    getLabel(): any;
    setLabel(label: any): this;
    getBalance(): any;
    setBalance(balance: any): this;
    getUnlockedBalance(): any;
    setUnlockedBalance(unlockedBalance: any): this;
    getNumUnspentOutputs(): any;
    setNumUnspentOutputs(numUnspentOutputs: any): this;
    isUsed(): any;
    setIsUsed(isUsed: any): this;
    getNumBlocksToUnlock(): any;
    setNumBlocksToUnlock(numBlocksToUnlock: any): this;
    toString(indent: any): string;
}
